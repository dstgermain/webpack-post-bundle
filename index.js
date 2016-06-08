module.exports = function webpackPostBundle(commands) {
  const fs = require('fs');
  const cliColors = require('cli-color');
  const self = this;
  const logFile = 'process_temp.log';
  const log = process.stdout;
  var fileWriteStream = null;

  var commandIndex = 0;

  this.handleBashFile = function handleBashFile(err, data) {
    if (err) throw err;

    // remove nodejs command markers
    const fileData = data.replace(/(^>\s.*$)/gm, '');
    log.write(fileData ? `\n${fileData.trim()}\n` : '\nDone, without errors.\n\n');

    fs.writeFileSync(logFile, '');
    fileWriteStream.end();
    this.nextCommand();
  };

  this.readBashFile = function readBashFile(code) {
    if (code) process.stderr.write('\x07');
    fs.readFile(logFile, 'utf8', this.handleBashFile.bind(this));
  };

  this.runCommand = function runCommand(cmd) {
    const spawn = require('child_process').spawn;
    const command = cmd.split(' ');

    fileWriteStream = fs.createWriteStream(logFile, {
      flags: 'w',
      defaultEncoding: 'utf8',
      fd: null,
      autoClose: true
    });

    log.write(`\nRunning Post Bundle Command: ${cmd}\n`);
    const child = spawn(command.shift(), command, {
      detached: true,
      env: process.env
    });

    child.stdout.pipe(fileWriteStream);
    // child.stderr.pipe(file); // - uncomment for debugging

    child.on('close', this.readBashFile.bind(this));

    child.unref();
  };

  this.nextCommand = function nextCommand() {
    if (commands[commandIndex]) {
      self.runCommand(commands[commandIndex]);
      commandIndex++;
    } else if (commandIndex > 0) {
      log.write(cliColors.green('Post Bundle tasks complete.\n'));
    }
  };

  this.cleanupTempFiles = function cleanupTempFiles() {
    try {
      log.write(cliColors.yellow(`\nRemoving ${logFile}`));
      fs.unlink(logFile);
    } catch (e) {
      log.write(cliColors.red(`${logFile} not found.\n`));
    }

    process.kill(0);
  };

  this.compilerDone = function compilerDone() {
    commandIndex = 0;
    setTimeout(() => self.nextCommand(), 1);
  };

  this.apply = function apply(compiler) {
    process.once('exit', this.cleanupTempFiles);
    process.once('SIGINT', this.cleanupTempFiles);
    process.once('uncaughtException', this.cleanupTempFiles);
    compiler.plugin('done', this.compilerDone.bind(this));
  };
};
