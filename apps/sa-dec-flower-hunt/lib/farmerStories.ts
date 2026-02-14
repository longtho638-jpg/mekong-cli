export interface FarmerStoryType {
    flowerId: number;
    farmerName: string;
    age: number;
    location: string;
    specialty: string;
    experience: string;
    avatar: string; // URL for mock avatar
    images: string[];
    flowerName: string; // Added for name-based lookup
    title: string;
    quote: string;
    story: string;
    funFact: string;
    tags: string[];
}

export const FARMER_STORIES: Record<number, FarmerStoryType> = {
    1: {
        flowerId: 1,
        flowerName: "Cúc Mâm Xôi",
        farmerName: "Chú Nguyễn Văn Thanh",
        age: 52,
        location: "Ấp Tân Quy Đông, Sa Đéc",
        specialty: "Cúc Mâm Xôi Vàng",
        experience: "30 năm",
        avatar: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=200",
        images: [
            "https://images.unsplash.com/photo-1621966046294-2393c04d538e?q=80&w=600",
            "https://images.unsplash.com/photo-1589396349692-7472c57803a6?q=80&w=600"
        ],
        title: "Tôi không bán hoa, tôi bán mùa xuân",
        quote: "\"Từng chậu cúc mâm xôi như đứa con tinh thần, tôi chăm bẵm từ lúc hạt mầm bé xíu cho đến khi nở vàng rực rỡ.\"",
        story: "Bạn biết không, để có được một chậu cúc mâm xôi tròn đầy, vàng rực đúng Tết, người nông dân phải canh từng con nước, từng cơn gió. Có những đêm sương muối, tôi phải thức trắng đốt đèn sưởi ấm cho hoa. Những vết chai sạn trên tay tôi là minh chứng cho tình yêu với đất, với nghề. Nhưng khi thấy khách hàng cười tươi rói ôm chậu hoa về nhà, bao mệt mỏi tan biến. Tôi muốn mang mùa xuân Sa Đéc đến từng ngôi nhà Việt.",
        funFact: "Cúc Mâm Xôi cần đúng 120 ngày nắng để nở hoa đẹp nhất!",
        tags: ["#TamHuyet", "#TruyenThong", "#CucMamXoi"]
    },
    2: {
        flowerId: 2,
        flowerName: "Hoa Hồng Sa Đéc",
        farmerName: "Anh Hoàng Văn Nam",
        age: 41,
        location: "Phường 1, Sa Đéc",
        specialty: "Hoa Hồng Cổ & Ngoại Nhập",
        experience: "Gia đình 3 đời",
        avatar: "https://images.unsplash.com/photo-1542596594-649edbc13630?q=80&w=200",
        images: [
            "https://images.unsplash.com/photo-1496857239036-1fb137683000?q=80&w=600",
            "https://images.unsplash.com/photo-1548586196-aa5803b77379?q=80&w=600"
        ],
        title: "Giữ gìn hồn cốt hoa hồng Sa Đéc",
        quote: "\"Mỗi giống hoa hồng là một cá tính. Hiểu nó, yêu nó thì nó mới tỏa hương sắc đền đáp mình.\"",
        story: "Gia đình tôi 3 đời trồng hồng ở Sa Đéc. Có những lúc thăng trầm, nhiều người bỏ nghề vì sâu bệnh, nhưng tôi vẫn kiên trì. Tôi tìm tòi lai ghép các giống hồng cổ Sa Đéc với hồng ngoại nhập để tạo ra những bông hoa vừa thơm, vừa bền màu, lại kháng bệnh tốt. Mua hoa của tôi không chỉ là mua cái đẹp, mà là mua cả sự đam mê và sáng tạo của người nông dân hiện đại.",
        funFact: "Anh Nam có thể phân biệt 50 loại hoa hồng chỉ bằng mùi hương!",
        tags: ["#NgheNhan", "#HoaHong", "#DamMe"]
    },
    3: {
        flowerId: 3,
        flowerName: "Vạn Thọ Pháp",
        farmerName: "Cô Nguyễn Thị Lan",
        age: 49,
        location: "Xã Tân Khánh Đông",
        specialty: "Vạn Thọ & Cúc Đài Loan",
        experience: "28 năm",
        avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=200",
        images: [
            "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?q=80&w=600",
            "https://images.unsplash.com/photo-1603532665971-d64cbb758156?q=80&w=600"
        ],
        title: "Người phụ nữ của những đóa Vạn Thọ",
        quote: "\"Vạn Thọ là lời chúc sức khỏe, là sự trường tồn. Trồng hoa này là tích đức cho đời.\"",
        story: "28 năm gắn bó với nghề, cô Lan chưa bao giờ chán nhìn ngắm những ruộng Vạn Thọ vàng ươm. Với cô, trồng hoa Vạn Thọ đòi hỏi sự tỉ mỉ và kiên nhẫn. Cô luôn tâm niệm làm sao để hoa nở đúng Tết, giúp bà con có cái Tết ấm no. Những chậu Vạn Thọ của cô nổi tiếng vì bông to, màu sắc rực rỡ và lâu tàn, như chính tấm lòng của người dân Sa Đéc.",
        funFact: "Tên 'Lan' nhưng cô lại nổi tiếng nhất vùng với hoa Vạn Thọ!",
        tags: ["#TruongTho", "#BinhAn", "#PhuNuLamNong"]
    },
    4: {
        flowerId: 4,
        flowerName: "Hoa Giấy Đỏ",
        farmerName: "Chị Trần Thị Nga",
        age: 38,
        location: "Làng hoa Sa Đéc",
        specialty: "Hoa Giấy Ngũ Sắc",
        experience: "15 năm",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200",
        images: [
            "https://images.unsplash.com/photo-1610397648930-477b8c7f0943?q=80&w=600",
            "https://images.unsplash.com/photo-1563242636-c0c5b525d80b?q=80&w=600"
        ],
        title: "Nghệ nhân uốn hoa giấy",
        quote: "\"Cây hoa giấy khô khan nhưng qua bàn tay uốn nắn sẽ trở thành tác phẩm nghệ thuật mềm mại.\"",
        story: "Chị Nga là một trong những nghệ nhân trẻ tiên phong trong việc tạo hình hoa giấy nghệ thuật tại Sa Đéc. Không chỉ trồng hoa giấy thông thường, chị còn ghép nhiều màu hoa trên cùng một thân cây (hoa ngũ sắc) và uốn tạo thế bonsai độc đáo. Sản phẩm của chị mang vẻ đẹp rực rỡ, bền bỉ, tượng trưng cho sức sống mãnh liệt.",
        funFact: "Chị Nga từng đạt giải Vàng cuộc thi sinh vật cảnh Đồng Tháp.",
        tags: ["#NgheThuat", "#Bonsai", "#HoaGiay"]
    },
    5: {
        flowerId: 5,
        flowerName: "Cát Tường",
        farmerName: "Anh Lê Văn Tuấn",
        age: 44,
        location: "Xã An Hòa",
        specialty: "Cát Tường & Ly Ly",
        experience: "22 năm",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=200",
        images: [
            "https://images.unsplash.com/photo-1494972308805-463bc619d34e?q=80&w=600",
            "https://images.unsplash.com/photo-1520392301077-d54d19d6fe7c?q=80&w=600"
        ],
        title: "Mang vẻ đẹp đài các về làng quê",
        quote: "\"Cát Tường khó trồng, nhưng khi nở thì đẹp đến nao lòng. Như người con gái đẹp cần được yêu chiều.\"",
        story: "Quyết tâm mang những giống hoa khó tính, cao cấp về thuần dưỡng tại khí hậu nhiệt đới của Sa Đéc, anh Tuấn đã trải qua nhiều thất bại. Nhưng giờ đây, vườn Cát Tường của anh là niềm tự hào của cả xã An Hòa. Hoa của anh cánh dày, màu sắc ngọt ngào, được các shop hoa cao cấp ở Sài Gòn săn đón.",
        funFact: "Anh Tuấn thiết kế riêng hệ thống tưới phun sương tự động điều khiển bằng điện thoại.",
        tags: ["#CongNgheCao", "#CatTuong", "#TinhTe"]
    },
    6: {
        flowerId: 6,
        flowerName: "Mai Vàng",
        farmerName: "Bác Ba Đời",
        age: 65,
        location: "Vùng lõi Làng hoa",
        specialty: "Mai Vàng Cổ Thụ",
        experience: "50 năm",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200",
        images: [
            "https://images.unsplash.com/photo-1455659817273-f96807779a8a?q=80&w=600",
            "https://images.unsplash.com/photo-1516205651411-4478982a3928?q=80&w=600"
        ],
        title: "Cây đại thụ của làng hoa",
        quote: "\"Thấy hoa mai nở là thấy Tết. Tôi giữ nghề này để giữ cái nếp nhà, cái hồn dân tộc.\"",
        story: "Bác Ba là một trong những người cao tuổi nhất còn trực tiếp làm nghề. Vườn mai của bác có những gốc mai cả trăm năm tuổi. Bác không chỉ bán mai, bác bán cả sự may mắn và thịnh vượng. Khách hàng của bác từ khắp cả nước, cứ Tết đến là lại tìm về, không phải chỉ để mua cây, mà để nghe bác kể chuyện đời, chuyện nghề.",
        funFact: "Bác Ba chưa bao giờ dùng Facebook, nhưng khách hàng đặt cây qua Zalo thì bác chốt đơn 'thần tốc'!",
        tags: ["#LaoNong", "#DiSan", "#MaiVang"]
    },
};
