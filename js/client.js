
export default class Client {
  constructor (world, addr) {
    this.world = world
    this.addr = addr
    this.connections = new Map()
    this.requests = new Map()
    this.requestCount = 0
    this.world.addHook(() => {
      for (let c of this.connections.values()) {
        let d = c.read()
        if (d && d.type === 'response') {
          let cb = this.requests.get(d.id)
          if (cb) {
            cb(null, d.data)
          }
        }
      }
      return false
    })
  }
  connect (domain) {
    let connection = this.connections.get(domain)
    if (!connection) {
      connection = this.world.connectIn(this.addr, domain)
      this.connections.set(domain, connection)
    }
    return connection
  }
  request (domain, path, cb) {
    let c = this.connect(domain)
    let id = this.requestCount++
    let r = {
      type: 'request',
      id: id,
      path: path,
    }
    this.requests.set(id, cb)
    c.write(r)
  }
}
