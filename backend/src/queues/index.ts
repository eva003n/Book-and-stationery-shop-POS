import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { API_DOC_URI, APP_NAME } from "../config/env";
import type { Queue } from "bullmq";

// Website: https://oneuptime.com/blog/post/2026-01-21-bullmq-bull-board/view#installing-bull-board

// create express adapter
export const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath("/queues");

// import created queues

//  create dashboard
createBullBoard({
//   queues: [new BullMQAdapter(/* queue instance */)],
  serverAdapter,
  options: {
    uiConfig: {
        boardTitle: APP_NAME,
        miscLinks: [
            {
                text: "Documentation",
                url: API_DOC_URI as string
            }
        ]
    }
  }
});

type QueueGroup = {
    name: string,
    queues: Queue[]
}

// grouped bullboard 
class GroupedBullBoard {
    private serverAdapter: ExpressAdapter

    constructor(groups: QueueGroup[]) {
        this.serverAdapter = new ExpressAdapter()
        this.serverAdapter.setBasePath("/queues")

        // flattenand prefiz queue names for grouping
        const adapters = groups.flatMap((group) => 
        group.queues.map(queue => {
            //prefix to identify group
            const adapter = new BullMQAdapter(queue, {
                description: `Group:${group.name}`
            })

            return adapter
        })
        )

        createBullBoard({
            queues: adapters,
            serverAdapter: this.serverAdapter
        })
    }

    getRouter() {
        return this.serverAdapter.getRouter()
    }
}

const groups: QueueGroup[] = [
    {
        name: "Payment",
        queues: []
    },
    {
        name: "Sales",
        queues: []
    },
    {
        name: "Reports", 
        queues: []
    }
]

export const groupedBoard = new GroupedBullBoard(groups)
