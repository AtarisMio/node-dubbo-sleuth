import { IBoot, Application } from 'egg';

export class ExampleServer implements IBoot {
    app: Application;
    constructor(app: Application) {
        this.app = app;
    }
    async didLoad() {
        await Promise.all([
            this.app.dubbo.ready(),
        ]);
    }
}

export default ExampleServer;
