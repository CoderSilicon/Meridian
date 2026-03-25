/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import './fonts/font.scss'
import App from './App.tsx'

const root = document.getElementById('root')

render(() => <App />, root!)
