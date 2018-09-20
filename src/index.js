import { root } from 'solid-js';
import App from './App';
import mapToProps from './mapToProps'

root(() => document.body.appendChild(App(mapToProps())));