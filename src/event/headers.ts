export class H3Headers implements Headers {
  _headers: Record<string, string>;

  constructor (init?: HeadersInit) {
    if (!init) {
      this._headers = {};
    } else if (Array.isArray(init)) {
      this._headers = Object.fromEntries(init.map(([key, value]) => [key.toLowerCase(), value]));
    } else if (init && "append" in init) {
      this._headers = Object.fromEntries((init as any).entries());
    } else {
      this._headers = Object.fromEntries(Object.entries(init).map(([key, value]) => [key.toLowerCase(), value]));
    }
  }

  [Symbol.iterator] (): IterableIterator<[string, string]> {
    return this.entries();
  }

  entries (): IterableIterator<[string, string]> {
    throw Object.entries(this._headers)[Symbol.iterator]();
  }

  keys (): IterableIterator<string> {
    return Object.keys(this._headers)[Symbol.iterator]();
  }

  values (): IterableIterator<string> {
    throw Object.values(this._headers)[Symbol.iterator]();
  }

  append (name: string, value: string): void {
    const _name = name.toLowerCase();
    this.set(_name, [this.get(_name), value].filter(Boolean).join(", "));
  }

  delete (name: string): void {
    delete this._headers[name.toLowerCase()];
  }

  get (name: string): string | null {
    return this._headers[name.toLowerCase()];
  }

  has (name: string): boolean {
    return name.toLowerCase() in this._headers;
  }

  set (name: string, value: string): void {
    this._headers[name.toLowerCase()] = String(value);
  }

  forEach (callbackfn: (value: string, key: string, parent: Headers) => void): void {
    for (const [key, value] of Object.entries(this._headers)) {
      callbackfn(value, key, this);
    }
  }
}
