import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"

export function StepOne() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
        >
            <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                    <Input id="name" name="full_name" placeholder="Nguyễn Văn A" className="pl-9" required />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" name="phone" placeholder="0909..." type="tel" required />
            </div>
        </motion.div>
    )
}
