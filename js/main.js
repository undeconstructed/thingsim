
import * as thing from './thing.js'
import * as sim from './sim.js'

let world = new sim.World(document.body)
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
home.newUnit('c-1', thing.Cache)
home.newUnit('s-1', thing.Store)

let club = world.newDomain('club')
club.newUnit('fe-1', thing.Frontend)
club.alias('www', 'fe-1')

setInterval(() => world.tick(), 1000)

let client = world.newClient('me')
client.request('home', 'thing', (e, r) => {
  console.log('response', r)
})
window.client = client
