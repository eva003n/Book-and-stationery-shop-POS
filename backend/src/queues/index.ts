import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { API_DOC_URI, APP_NAME } from "../config/env";
import type { Queue } from "bullmq";
import { emailQueue } from "./email.queue.js";

// Website: https://oneuptime.com/blog/post/2026-01-21-bullmq-bull-board/view#installing-bull-board

// create express adapter
export const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath("/queues");

// import created queues

//  create dashboard
/* createBullBoard({

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
}); */

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
          serverAdapter: this.serverAdapter,
          options: {
            uiConfig: {
              boardTitle: APP_NAME as string,
              miscLinks: [
                {
                  text: "Documentation",
                  url: API_DOC_URI as string,
                },
              ],
            },
          },
        });
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
    },
    {
        name: "Email",
        queues: [emailQueue]
    }
]

export const groupedBoard = new GroupedBullBoard(groups)
export {enqueueEmail} from "./email.queue.js"
