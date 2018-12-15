
import { mkel } from './util.js'
import * as thing from './thing.js'
import * as sim from './sim.js'

let root = document.body

let toolbar = mkel('div', { style: 'border: 1px solid black' })
let tickButton = mkel('button', { text: 'tick' })
let autoButton = mkel('button', { text: 'auto' })
let viewBox = mkel('div', { style: 'border: 1px solid black' })

toolbar.appendChild(tickButton)
toolbar.appendChild(autoButton)
root.appendChild(toolbar)
root.appendChild(viewBox)

let world = new sim.World(viewBox)
window.world = world

let home = world.newDomain('home')
home.manage({
  type: 'frontend',
  unit: thing.Frontend,
  alias: 'www'
})
home.newUnit('h-1', thing.Host)
home.newUnit('r-1', thing.Registry)
home.alias('registry', 'r-1')
home.newUnit('l-1', thing.Library)
home.alias('library', 'l-1')
home.newUnit('c-1', thing.Cache)
home.newUnit('s-1', thing.Store)
home.alias('store', 's-1')

let club = world.newDomain('club')
club.newUnit('fe-1', thing.Frontend)
club.alias('www', 'fe-1')

let client = world.newClient('me')

world.updateUI()

let onAuto = false
tickButton.addEventListener('click', e => {
  if (onAuto) {
    return
  }
  world.tick()
})
autoButton.addEventListener('click', e => {
  if (onAuto) {
    return
  }
  onAuto = true
  setInterval(() => {
    world.tick()
  }, 1000)
})

// autoButton.click()

client.request('home', 'thing', (e, r) => {
  console.log('response', r)
})
window.client = client
