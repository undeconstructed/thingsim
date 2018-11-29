
import * as thing from './thing.js'
import * as sim from './sim.js'

let world = new sim.World(document.body)
window.world = world

let home = world.newDomain('home')
home.newUnit('fe-1', new thing.Frontend())
home.newUnit('h-1', new thing.Host())
home.alias('www', 'fe-1')

setInterval(() => world.tick(), 1000)
