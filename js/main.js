
import * as thing from './thing.js'
import * as sim from './sim.js'

let world = new sim.World(document.body)
window.world = world

let home = world.newDomain('home')
home.newUnit('f-1', thing.Frontend)
home.alias('www', 'f-1')
home.newUnit('h-1', thing.Host)
home.newUnit('r-1', thing.Registry)
home.alias('registry', 'r-1')

let club = world.newDomain('club')
club.newUnit('fe-1', thing.Frontend)
club.alias('www', 'fe-1')

setInterval(() => world.tick(), 1000)

let client = world.newClient('me')
client.request('home', 'thing', (e, r) => {
  console.log('response', r)
})
window.client = client
