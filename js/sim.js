
import * as random from './random.js'
import { mkel } from './util.js'
import { Animator, Box, Label } from './drawing.js'
import Client from './client.js'

// Connection connects units, transiently
class Connection {
  constructor (element, id, from, to) {
    this.id = id
    this.from = from
    this.to = to
    this.d0 = []
    this.d1 = []
    this.d0t = []
    this.d1t = []
    if (element) {
      this.setupUI(element)
    }
  }
  setupUI (element) {
    this.ui = {
      root: element
    }
  }
  tick (c) {
    this.d0 = this.d0.concat(this.d1t)
    this.d1t = []
    this.d1 = this.d1.concat(this.d0t)
    this.d0t = []
    if (this.ui) {
      this.updateUI()
    }
  }
  updateUI () {
    let upSym = '⚪'
    let downSym = '⚪'
    if (this.d0.length) {
      upSym = '⚫'
    }
    if (this.d1.length) {
      downSym = '⚫'
    }
    this.ui.root.textContent = `${this.id} - ${this.from} ${upSym} - ${this.to} ${downSym}`
  }
}

// Endpoint is a connection as seen by one of its ends
class Endpoint {
  constructor (connection, up) {
    this.connection = connection
    this.up = up
  }
  get id () {
    return this.connection.id
  }
  get addr () {
    return this.up ? this.connection.to : this.connection.from
  }
  write (frame) {
    let t = this.up ? this.connection.d1t : this.connection.d0t
    t.push(frame)
  }
  read () {
    let t = this.up ? this.connection.d1 : this.connection.d0
    return t.shift()
  }
}

// Unit is a process, basically
class Unit {
  constructor (host, element, addr, handlerClazz) {
    this.host = host
    this.addr = addr
    this.handlerClazz = handlerClazz
    this.handler = null
    this.connections = new Map()
    if (element) {
      this.setupUI(element)
    }
  }
  setupUI (element) {
    this.ui = {
      root: element
    }
    this.ui.root.textContent = this.addr
  }
  // for unit to use
  lookup (name) {
    // DNS
    let byAlias = this.host.aliases.get(name)
    if (byAlias) {
      name = byAlias
    }
    return name
  }
  connect (to) {
    to = this.lookup(to)
    let conn = this.connections.get(to)
    if (!conn) {
      conn = this.host.connect(this, to)
      this.connections.set(to, conn)
    }
    return conn
  }
  // for sim
  tick (c) {
    if (!this.handler) {
      let element = null
      if (this.ui) {
        element = mkel('div')
        this.ui.root.appendChild(element)
      }
      try {
        let handler = new this.handlerClazz(this, element)
        handler.tick = handler.tick || (() => true)
        this.handler = handler
      } catch (e) {
        console.log('failed to init', this.host.name, this.addr, e)
        return
      }
    }
    try {
      this.handler.tick(this)
    } catch (e) {
      console.log('failed to tick', this.host.name, this.addr, e)
      return
    }
  }
  connectIn (connection) {
    this.connections.set(connection.addr, connection)
  }
}

function makeConnectionId(addr1, addr2) {
  return (addr1 < addr2) ? `${addr1}:${addr2}` : `${addr2}:${addr1}`
}

// Domain runs some units
class Domain {
  constructor (internet, element, name) {
    this.internet = internet
    this.name = name
    this.specs = new Map()
    this.units = new Map()
    this.connections = new Map()
    this.aliases = new Map()
    if (element) {
      this.setupUI(element)
    }
  }
  setupUI (element) {
    this.ui = {
      root: element,
      top: mkel('ul')
    }
    this.ui.root.textContent = this.name

    let units = mkel('li', { text: 'units' })
    this.ui.units = mkel('ul')
    units.appendChild(this.ui.units)
    this.ui.top.appendChild(units)

    let connections = mkel('li', { text: 'connections' })
    this.ui.connections = mkel('ul')
    connections.appendChild(this.ui.connections)
    this.ui.top.appendChild(connections)

    this.ui.root.appendChild(this.ui.top)
  }
  // for admin
  manage (spec) {
    this.specs.set(spec.type, spec)
    spec.count = 0
    // just make one for now
    let addr = `${spec.type}-${spec.count}`
    this.newUnit(addr, spec.unit)
    spec.count++
    if (spec.alias) {
      this.alias(spec.alias, addr)
    }
  }
  newUnit (addr, handlerClazz) {
    let element = null
    if (this.ui) {
      element = mkel('li')
      this.ui.units.appendChild(element)
    }
    let unit = new Unit(this, element, addr, handlerClazz)
    this.units.set(addr, unit)
    return unit
  }
  alias (alias, addr) {
    this.aliases.set(alias, addr)
  }
  // for units
  connect (unit, to) {
    let tgt = this.units.get(to)
    if (!tgt) {
      throw new Error('no target: ' + to)
    }
    let connection = this.newConnection(unit.addr, to)
    tgt.connectIn(new Endpoint(connection, false))
    return new Endpoint(connection, true)
  }
  newConnection (from, to) {
    let element = null
    if (this.ui) {
      element = mkel('li')
      this.ui.connections.appendChild(element)
    }

    let id = random.id()
    let connection = new Connection(element, id, from, to)
    this.connections.set(id, connection)
    return connection
  }
  connectOut () {
    // TODO
  }
  // for sim
  connectIn (connection) {
    let to = this.aliases.get('www')
    if (!to) {
      throw new Error('no alias www')
    }
    let unit = this.units.get(to)
    if (!unit) {
      throw new Error('no unit ' + addr)
    }
    unit.connectIn(new Endpoint(connection, false))
  }
  tick () {
    for (let [addr, unit] of [...this.units]) {
      unit.tick()
    }
    for (let [id, connection] of [...this.connections]) {
      connection.tick()
    }
  }
}

// World links domains
export class World {
  constructor (element) {
    this.n = 0
    this.domains = new Map()
    this.connections = new Map()
    this.clients = new Map()
    this.hooks = []
    // ui
    if (element) {
      this.setupUI(element)
    }
  }
  // for admin
  newDomain(name) {
    let element = null
    if (this.ui) {
      element = mkel('li')
      this.ui.domains.appendChild(element)
    }
    let domain = new Domain(this, element, name)
    this.domains.set(name, domain)
    return domain
  }
  // for user
  newClient (addr) {
    let element = null
    if (this.ui) {
      element = mkel('li')
      this.ui.clients.appendChild(element)
    }
    let client = new Client(this, element, addr)
    this.clients.set(addr, client)
    return client
  }
  newConnection (from, to) {
    let element = null
    if (this.ui) {
      element = mkel('li')
      this.ui.connections.appendChild(element)
    }

    let id = random.id()
    let connection = new Connection(element, id, from, to)
    this.connections.set(id, connection)
    return connection
  }
  connectIn (addr, domain) {
    let tgt = this.domains.get(domain)
    if (!tgt) {
      throw new Error('no domain ' + domain)
    }
    let connection = this.newConnection(addr, domain)
    tgt.connectIn(connection)
    return new Endpoint(connection, true)
  }
  // for sim
  addHook (f) {
    this.hooks.push(f)
  }
  connect (installation, unit, to) {
    // TODO
  }
  tick () {
    for (let [addr, client] of [...this.clients]) {
      client.tick()
    }
    for (let [name, domain] of [...this.domains]) {
      domain.tick()
    }
    for (let [id, connection] of [...this.connections]) {
      connection.tick()
    }
    for (let hook of this.hooks) {
      if (hook()) {
        this.hooks.remove(hook)
      }
    }
    this.updateUI()
    this.n++
  }
  setupUI (element) {
    this.ui = {
      root: element,
      top: mkel('ul'),
      n: mkel('li'),
      clientCount: 0,
      domainCount: 0
    }
    this.ui.top.appendChild(this.ui.n)

    let clients = mkel('li', { text: 'clients' })
    this.ui.clients = mkel('ul')
    clients.appendChild(this.ui.clients)
    this.ui.top.appendChild(clients)

    let domains = mkel('li', { text: 'domains' })
    this.ui.domains = mkel('ul')
    domains.appendChild(this.ui.domains)
    this.ui.top.appendChild(domains)

    let connections = mkel('li', { text: 'connections' })
    this.ui.connections = mkel('ul')
    connections.appendChild(this.ui.connections)
    this.ui.top.appendChild(connections)

    this.ui.canvas = mkel('canvas', { width: 1000, height: 800 })

    this.ui.root.appendChild(this.ui.canvas)
    // this.ui.root.appendChild(this.ui.top)

    this.ui.animator = new Animator(this.ui.canvas)
    this.ui.animator.appendChild(new Label(() => `n = ${this.n}`, 500, 10))
    this.ui.animator.start()
  }
  updateUI () {
    if (!this.ui) {
      return
    }

    for (let client of this.clients.values()) {
      if (!client.ui.box) {
        let left = 10 + this.ui.clientCount * (10 + 50)
        let box = new Box(left, 10, 50, 50)
        box.setSize(100, 100)
        client.ui.box = box
        let label = new Label(client.addr, 10, 10)
        box.appendChild(label)
        this.ui.animator.appendChild(box)
        this.ui.clientCount++
      }
    }
    for (let domain of this.domains.values()) {
      if (!domain.ui.box) {
        domain.ui.unitCount = 0
        let left = 10 + this.ui.domainCount * (20 + 200)
        let box = new Box(left, 130, 50, 50)
        box.color = 'rgb(100,100,100)'
        box.setSize(200, 50)
        domain.ui.box = box
        let label = new Label(domain.name, 10, 10)
        box.appendChild(label)
        this.ui.animator.appendChild(box)
        this.ui.domainCount++
      }
      for (let unit of domain.units.values()) {
        if (!unit.ui.box) {
          let top = 50 + domain.ui.unitCount * (10 + 50)
          let box = new Box(10, top, 50, 50)
          box.setSize(150, 50)
          unit.ui.box = box
          let label = new Label(unit.addr, 10, 10)
          box.appendChild(label)
          domain.ui.box.appendChild(box)
          domain.ui.unitCount++
        }
      }
      let height = 50 + domain.ui.unitCount * (10 + 50)
      domain.ui.box.setSize(200, height)
    }
    for (let connection of this.connections.values()) {
    }

    this.ui.n.textContent = `n = ${this.n}`
  }
}
