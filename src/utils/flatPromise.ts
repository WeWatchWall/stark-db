function flatPromise() {

  let resolve: (value?: any) => void, reject: (value?: any) => void;

  const promise: Promise<any> = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
  });

  return { promise, resolve, reject };
}