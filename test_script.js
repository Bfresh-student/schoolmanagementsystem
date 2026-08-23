const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM('<!DOCTYPE html><html><body><div id=\"mainContent\"></div><div id=\"navRH\"></div><div id=\"toastContainer\"></div></body></html>', { runScripts: 'dangerously', resources: 'usable' });
dom.window.eval('window.showToast = function(){}; window.localStorage = {getItem:()=>null}; window.getAccessToken=()=>null;');
const script = fs.readFileSync('frontend/js/api-client.js', 'utf8') + '\n' + fs.readFileSync('frontend/js/script_rh.js', 'utf8');
try {
  dom.window.eval(script);
  console.log('Script ran successfully');
} catch (e) {
  console.error('ERROR IN SCRIPT:', e);
}
