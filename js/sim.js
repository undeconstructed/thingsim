
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
  constructor (host, addr, handler) {
    this.host = host
    this.addr = addr
    this.handler = handler
    this.connections = new Map()
  }
  // for unit to use
  get (to, frame) {
    let conn = this.connections.get(to)
    if (!conn) {
      conn = this.host.connect(this, to)
      this.connections.set(to, conn)
    }
    conn.push(frame)
  }
  // for sim
  tick (c) {
    this.handler.tick(this)
  }
  connectIn (connection) {
    this.connections.set(connection.id, connection)
  }
}

// Domainruns some units
class Domain {
  constructor (internet) {
    this.internet = internet
    this.units = new Map()
    this.connections = new Map()
    this.aliases = new Map()
  }
  // for admin
  newUnit (addr, handler) {
    handler.init = handler.init || (() => true)
    handler.tick = handler.tick || (() => true)
    let unit = new Unit(this, addr, handler)
    this.units.set(addr, unit)
    return unit
  }
  alias (alias, addr) {
    this.aliases.set(alias, addr)
  }
  // for units
  connect (unit, to) {
    let id = (host.addr < to) ? `${host.addr}:${to}` : `${to}:${host.addr}`
    let connection = this.connections.get(id)
    if (!connection) {
      let tgt = this.units.get(to)
      if (!tgt) {
        throw 'error'
      }
      let connection = new Connection(id, unit.addr, to)
      tgt.connectIn(unit.addr, new Endpoint(connection, false))
      this.connections.set(id, connection)
    }
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

function randomId () {
  return (Math.random() + 1).toString(36).substr(2,5)
}

// World links domains
export class World {
  constructor (element) {
    this.element = element
    this.n = 0
    this.domains = new Map()
    this.connections = new Map()
  }
  // for admin
  newDomain(name) {
    let domain = new Domain(this, name)
    this.domains.set(name, domain)
    return domain
  }
  // for user
  connectIn (domain) {
    let tgt = this.domains.get(domain)
    if (!tgt) {
      throw 'error'
    }
    let id = randomId()
    let connection = new Connection(id, 'user', domain)
    tgt.connectIn(connection)
    this.connections.set(id, connection)
    return new Endpoint(connection, true)
  }
  // for sim
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
    this.element.textContent = this.n
  }
}
