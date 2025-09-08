import ready from 'domready';

import App from './App';


ready(() => {
  const app = new App()
  app.init()
})
