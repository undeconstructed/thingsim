
import * as random from './random.js'

class BuildingBlock {
  constructor () {
    this.ctx = null
  }
  tick (ctx) {
    this.ctx = ctx
    for (let [id, connection] of [...ctx.connections]) {
      let d = connection.read()
      if (d) {
        this.onData(connection, d)
      }
    }
    this.ctx = null
  }
}

export class Magic {
}

export class Registry extends BuildingBlock {
  onData (connection, d) {
    if (d.type === 'request') {
      connection.write({
        type: 'response',
        id: d.id,
        data: 'h-1'
      })
    }
  }
}

export class Host extends BuildingBlock  {
  onData (connection, d) {
    if (d.type === 'request') {
      connection.write({
        type: 'response',
        id: d.id,
        data: `oh yes, I know ${d.data}`
      })
    }
  }
}

export class Frontend extends BuildingBlock {
  constructor () {
    super()
    this.waiting = new Map()
  }
  onData (connection, d) {
    if (d.type === 'request') {
      // step 1, incoming request
      // lookup host in registry
      let id2 = random.id()
      this.waiting.set(id2, {
        connection: connection,
        request: d,
        host: null
      })
      let r2 = {
        type: 'request',
        id: id2,
        data: d.path
      }
      this.ctx.connect('registry').write(r2)
    } else if (d.type === 'response') {
      let w = this.waiting.get(d.id)
      if (w) {
        this.waiting.delete(d.id)
        if (w.host === null) {
          // step 2, registry lookup complete
          // make request to host
          w.host = d.data
          let id3 = random.id()
          this.waiting.set(id3, w)
          let r3 = {
            type: 'request',
            id: id3,
            data: w.request.path
          }
          this.ctx.connect(w.host).write(r3)
        } else {
          // step 3, operation complete
          // respond to caller
          let r = {
            type: 'response',
            id: w.request.id,
            data: `${w.request.path} -> ${d.data}`
          }
          w.connection.write(r)
        }
      }
    }
  }
}

export class Library extends BuildingBlock {
  onData (connection, data) {
    if (d.type === 'request') {
      connection.write({
        type: 'response',
        id: d.id,
        data: `template of ${d.data}`
      })
    }
  }
}

export class Store {
}

export class Cache {
}
