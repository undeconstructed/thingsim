
export default class Client {
  constructor (world) {
    this.world = world
    this.connections = new Map()
  }
  connect (domain) {
    let connection = this.connections.get(domain)
    if (!connection) {
      connection = this.world.connectIn(domain)
      this.connections.set(domain, connection)
    }
    return connection
  }
  request (domain, path) {
    let c = this.connect(domain)
    c.write(path)
    return new Promise((resolve, reject) => {
      this.world.addHook(() => {
        let d = c.read()
        if (!d) {
          return false
        }
        resolve(d)
      })
    })
  }
}
