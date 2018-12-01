
import * as random from './random.js'
import Client from './client.js'

// Connection connects units, transiently
class Connection {
  constructor (id, from, to) {
    this.id = id
    this.from = from
    this.to = to
    this.d0 = []
    this.d1 = []
    this.d0t = []
    this.d1t = []
  }
  tick (c) {
    this.d0 = this.d0.concat(this.d1t)
    this.d1t = []
    this.d1 = this.d1.concat(this.d0t)
    this.d0t = []
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
  constructor (host, addr, handlerClazz) {
    this.host = host
    this.addr = addr
    this.handlerClazz = handlerClazz
    this.handler = null
    this.connections = new Map()
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
      try {
        let handler = new this.handlerClazz()
        handler.init = handler.init || (() => true)
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
  constructor (internet, name) {
    this.internet = internet
    this.name = name
    this.units = new Map()
    this.connections = new Map()
    this.aliases = new Map()
  }
  // for admin
  newUnit (addr, handlerClazz) {
    let unit = new Unit(this, addr, handlerClazz)
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
      throw 'error'
    }

    let id = random.id()
    let connection = new Connection(id, unit.addr, to)
    this.connections.set(id, connection)
    tgt.connectIn(new Endpoint(connection, false))
    return new Endpoint(connection, true)
  }
  connectOut () {
    // TODO
  }
  // for sim
  connectIn (connection) {
    let to = this.aliases.get('www')
    if (!to) {
      throw 'error'
    }
    let unit = this.units.get(to)
    if (!unit) {
      throw 'error'
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
    this.element = element
    this.n = 0
    this.domains = new Map()
    this.connections = new Map()
    this.hooks = []
  }
  // for admin
  newDomain(name) {
    let domain = new Domain(this, name)
    this.domains.set(name, domain)
    return domain
  }
  // for user
  newClient (addr) {
    return new Client(this, addr)
  }
  connectIn (addr, domain) {
    let tgt = this.domains.get(domain)
    if (!tgt) {
      throw 'error'
    }
    let id = makeConnectionId(addr, domain)
    let connection = new Connection(id, addr, domain)
    tgt.connectIn(connection)
    this.connections.set(addr, connection)
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
    this.n++
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
    this.element.textContent = this.n
  }
}
