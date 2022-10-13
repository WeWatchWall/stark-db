/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
 const exec = require('child_process').exec;
 return new Promise((resolve, reject) => {
  exec(cmd, (error, stdout, stderr) => {
   if (error) {
     console.warn(error);
     reject(error);
   }
   resolve(stdout? stdout : stderr);
  });
 });
}

module.exports = execShellCommand;
