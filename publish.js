const execShellCommand = require("./execShellCommand.js");
const FlatPromise = require('flat-promise');

const packName = 'stark-db';
const WAIT_TIME = 10e3;

async function publish() {
  const latestVersion = await import('latest-version');
  let version = await latestVersion.default(packName);
  
  console.log(await execShellCommand('npm publish'));
  await wait(WAIT_TIME);
  console.log(await execShellCommand(`npm unpublish ${packName}@${version}`));
}

async function wait(ms) {
  let flatPromise = new FlatPromise();

  setTimeout(() => flatPromise.resolve(), ms);
  return flatPromise.promise;
}

publish();