"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export function RecentOrders() {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Nguyễn Văn A</p>
                    <p className="text-sm text-muted-foreground">
                        0901234567
                    </p>
                </div>
                <div className="ml-auto font-medium">+1.500.000₫</div>
                <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">Mới</Badge>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/02.png" alt="Avatar" />
                    <AvatarFallback>JL</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Trần Thị B</p>
                    <p className="text-sm text-muted-foreground">
                        0912345678
                    </p>
                </div>
                <div className="ml-auto font-medium">+450.000₫</div>
                <Badge className="ml-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Đang giao</Badge>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/03.png" alt="Avatar" />
                    <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Lê Văn C</p>
                    <p className="text-sm text-muted-foreground">
                        0987654321
                    </p>
                </div>
                <div className="ml-auto font-medium">+2.100.000₫</div>
                <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">Đã giao</Badge>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/04.png" alt="Avatar" />
                    <AvatarFallback>WK</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Phạm Thị D</p>
                    <p className="text-sm text-muted-foreground">
                        0933445566
                    </p>
                </div>
                <div className="ml-auto font-medium">+850.000₫</div>
                <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">Mới</Badge>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="/avatars/05.png" alt="Avatar" />
                    <AvatarFallback>SD</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Hoàng Văn E</p>
                    <p className="text-sm text-muted-foreground">
                        0977889900
                    </p>
                </div>
                <div className="ml-auto font-medium">+3.200.000₫</div>
                <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100">Đã giao</Badge>
            </div>
        </div>
    )
}
