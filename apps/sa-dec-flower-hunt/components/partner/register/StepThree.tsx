import { motion } from "framer-motion"
import { Check } from "lucide-react"

export function StepThree() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 text-center py-4"
        >
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Sẵn sàng gia nhập!</h3>
            <p className="text-stone-500 text-sm">
                Bằng việc nhấn "Đăng ký", bạn đồng ý với các điều khoản hợp tác của Sàn Dropshipping Sa Đéc.
            </p>
        </motion.div>
    )
}
