import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Sprout } from "lucide-react"

export function StepTwo() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="gardenName">Tên vườn</Label>
                <div className="relative">
                    <Store className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <Input id="gardenName" name="garden_name" placeholder="Vườn hoa Út Cưng" className="pl-9" required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ vườn</Label>
                <Input id="address" name="address" placeholder="Tân Quy Đông, Sa Đéc..." required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="flowers">Các loại hoa chủ lực</Label>
                <div className="relative">
                    <Sprout className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <Input id="flowers" name="flower_types" placeholder="Cúc mâm xôi, Hồng lửa..." className="pl-9" required />
                </div>
            </div>
        </motion.div>
    )
}
