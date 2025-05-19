class Bus {
  list: any;
  constructor() {
    this.list = {};
  }

  $on(name: string, fn: any) {
    this.list[name] = this.list[name] || [];
    this.list[name].push(fn);
  }

  $emit(name: string, data: any) {
    if (this.list[name]) {
      this.list[name].forEach((fn: any) => {
        fn(data);
      });
    }
  }

  $off(name: string) {
    if (this.list[name]) {
      delete this.list[name];
    }
  }
}
export default new Bus();
