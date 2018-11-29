
export class Magic {
}

export class Registry {
}

export class Host {
  tick () {
  }
}

export class Frontend {
  tick (ctx) {
    for (let [id, connection] of [...ctx.connections]) {
      let d = connection.read()
      if (d) {
        console.log('address', ctx.addr, 'connection', id, 'data', d)
        connection.write('echo ' + d)
      }
    }
  }
}

export class Library {
}

export class Store {
}

export class Cache {
}
