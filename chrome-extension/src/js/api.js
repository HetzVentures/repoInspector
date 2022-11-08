
class Api {

    constructor() {
        this.urlBase = "http://www.hetzventures.org/"
    }

    async post(url = '', data = {}) {
        const response = await fetch(`${this.urlBase}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        return response.json();
      }


      async get(url = '') {
        const response = await fetch(`${this.urlBase}${url}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        return response.json();
      }
}

export const api = new Api();