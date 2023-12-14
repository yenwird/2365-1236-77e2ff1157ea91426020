import { app, InvocationContext } from "@azure/functions";
import * as https from "https";
import * as df from "durable-functions";
import { ActivityHandler, OrchestrationContext, OrchestrationHandler } from "durable-functions";
import { Engine } from "json-rules-engine";

const defineEngine = () => {
    const engine = new Engine()

    engine.addOperator('es', (factValue, jsonValue) => {
        return true
    })
    engine.addOperator('contiene', (factValue, jsonValue) => {
        return true
    })

    return engine
}

const runRules: ActivityHandler = async function (facts: unknown, context: InvocationContext) {
    const engine = defineEngine()
    const rule0 = {"conditions":{"all":[{"any":[{"all":[{"fact":"Categoria","operator":"es","value":"Categoria"},{"fact":"dominio","operator":"es","value":"clientevip1.com"},{"fact":"Categoria","operator":"es","value":"ReclamoVIP"}]},{"all":[{"fact":"Categoria","operator":"es","value":"Reclamo"},{"fact":"dominio","operator":"es","value":"clientevip2.com"}]},{"all":[{"fact":"Categoria","operator":"es","value":"Reclamo"},{"fact":"dominio","operator":"es","value":"clientevip2.com"}]}]},{"all":[{"fact":"Subject","operator":"contiene","value":"Prioridad Baja"}]}]},"event":{"type":"Rule 1","params":{"actions":[{"type":"DERIVE"}]}}};
    const rule1 = {"conditions":{"all":[{"any":[{"all":[{"fact":"Categoria","operator":"es","value":"ReclamoVIP"},{"fact":"dominio","operator":"es","value":"clientevip1.com"},{"fact":"Categoria","operator":"es","value":"ReclamoVIP"}]},{"all":[{"fact":"Categoria","operator":"es","value":"Reclamo"},{"fact":"dominio","operator":"es","value":"clientevip2.com"}]},{"all":[{"fact":"Categoria","operator":"es","value":"Reclamo"},{"fact":"dominio","operator":"es","value":"clientevip2.com"}]}]},{"all":[{"fact":"Subject","operator":"contiene","value":"Prioridad Baja"}]}]},"event":{"type":"Rule 2","params":{"actions":[{"type":"DERIVE"}]}}};
    const rule2 = {"conditions":{"all":[{"any":[{"all":[{"fact":"Categoria","operator":"es","value":"ReclamoVIP"},{"fact":"dominio","operator":"es","value":"clientevip1.com"},{"fact":"Categoria","operator":"es","value":"ReclamoVIP"}]},{"all":[{"fact":"Categoria","operator":"es","value":"Reclamo"},{"fact":"dominio","operator":"es","value":"clientevip2.com"}]},{"all":[{"fact":"Categoria","operator":"es","value":"Reclamo"},{"fact":"dominio","operator":"es","value":"clientevip2.com"}]}]},{"all":[{"fact":"Subject","operator":"contiene","value":"Prioridad Baja"}]}]},"event":{"type":"Rule 3","params":{"actions":[{"type":"DERIVE"}]}}};
    
    engine.addRule(rule0);
    engine.addRule(rule1);
    engine.addRule(rule2);
    
    const result = await engine.run(facts)
    return result;
}


df.app.activity("runRules", {
    handler: runRules
});

const orchestrator: OrchestrationHandler = function* (context: OrchestrationContext) {
    const result = yield context.df.callActivity("runRules", context.df.getInput());
    return result;
}

df.app.orchestration("startOrchestrator", orchestrator);


export async function serviceBusQueueTrigger(message: unknown, context: InvocationContext): Promise<void> {
    context.log('Service bus queue function processed message:', message);
    const client = df.getClient(context);
    const instanceId: string = await client.startNew("startOrchestrator", message);
    context.log(`Started orchestration with ID = '${instanceId}'.`);
}
app.serviceBusQueue('orchestrator', {
    connection: 'azureQueueConnection',
    queueName: '2365-1236-77e2ff1157ea91426020',
    handler: serviceBusQueueTrigger,
    extraInputs: [df.input.durableClient()],
});