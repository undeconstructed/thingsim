
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
  constructor () {
    super()
    this.waiting = new Map()
  }
  onData (connection, d) {
    if (d.type === 'request') {
      // step 1, incoming request
      // load data
      let thingId = d.data
      let id2 = random.id()
      this.waiting.set(id2, {
        connection: connection,
        request: d,
        data: null
      })
      let r2 = {
        type: 'request',
        id: id2,
        data: thingId
      }
      this.ctx.connect('store').write(r2)
    } else if (d.type === 'response') {
      let w = this.waiting.get(d.id)
      if (w) {
        this.waiting.delete(d.id)
        if (w.data === null) {
          // step 2, store lookup complete
          // lookup code
          w.data = d.data
          let id3 = random.id()
          this.waiting.set(id3, w)
          let r3 = {
            type: 'request',
            id: id3,
            data: w.data.type
          }
          this.ctx.connect('library').write(r3)
        } else {
          // step 3, code loaded
          // do whatever and respond
          let r = {
            type: 'response',
            id: w.request.id,
            data: w.data.data
          }
          w.connection.write(r)
        }
      }
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
            data: d.data
          }
          w.connection.write(r)
        }
      }
    }
  }
}

export class Library extends BuildingBlock {
  onData (connection, d) {
    if (d.type === 'request') {
      connection.write({
        type: 'response',
        id: d.id,
        data: `template of ${d.data}`
      })
    }
  }
}

export class Store extends BuildingBlock {
  constructor () {
    super()
    this.store = new Map()
    this.preload()
  }
  preload () {
    this.store.set('thing', JSON.stringify({
      type: 'thing',
      id: 'thing',
      version: 1,
      data: {
        'foo': 'bar'
      }
    }))
  }
  onData (connection, d) {
    if (d.type === 'request') {
      let thingId = d.data
      let thing = this.store.get(thingId)
      if (thing) {
        thing = JSON.parse(thing)
      }
      connection.write({
        type: 'response',
        id: d.id,
        data: thing
      })
    }
  }
}

export class Cache {
}
