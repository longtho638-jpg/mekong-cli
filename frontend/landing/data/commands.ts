export interface CommandData {
  id: string
  layer: string
  displayName: string
  description: string
  complexity: string
  creditCost: number
  agents: string[]
}

import { COMMANDS_FOUNDER_A } from "./commands-founder-a"
import { COMMANDS_FOUNDER_B } from "./commands-founder-b"
import { COMMANDS_BUSINESS_A } from "./commands-business-a"
import { COMMANDS_BUSINESS_B } from "./commands-business-b"
import { COMMANDS_PRODUCT } from "./commands-product"
import { COMMANDS_ENGINEERING_A } from "./commands-engineering-a"
import { COMMANDS_ENGINEERING_B } from "./commands-engineering-b"
import { COMMANDS_ENGINEERING_C } from "./commands-engineering-c"
import { COMMANDS_OPS_A } from "./commands-ops-a"
import { COMMANDS_OPS_B } from "./commands-ops-b"
import { COMMANDS_OPS_C } from "./commands-ops-c"
import { COMMANDS_SUPER } from "./commands-super"

export const COMMANDS: CommandData[] = [
  ...COMMANDS_FOUNDER_A,
  ...COMMANDS_FOUNDER_B,
  ...COMMANDS_BUSINESS_A,
  ...COMMANDS_BUSINESS_B,
  ...COMMANDS_PRODUCT,
  ...COMMANDS_ENGINEERING_A,
  ...COMMANDS_ENGINEERING_B,
  ...COMMANDS_ENGINEERING_C,
  ...COMMANDS_OPS_A,
  ...COMMANDS_OPS_B,
  ...COMMANDS_OPS_C,
  ...COMMANDS_SUPER,
]
