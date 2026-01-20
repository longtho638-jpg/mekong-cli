"""
Unified Router for 14 Mekong Commands
"""
from fastapi import APIRouter

from backend.controllers.command_controller import CommandController
from backend.models.command import CommandRequest
from backend.services.command_service import CommandService

router = APIRouter(prefix="/api/commands", tags=["Mekong Commands"])

# Initialize controller
command_service = CommandService()
command_controller = CommandController(command_service)

@router.post("/khach-hang")
async def cmd_khach_hang(request: CommandRequest):
    """§1 Customer Profile via CommandController"""
    return await command_controller.execute_command("khach-hang", request)

@router.post("/ke-hoach-kinh-doanh")
async def cmd_ke_hoach_kinh_doanh(request: CommandRequest):
    """§2 Business Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-kinh-doanh", request)

@router.post("/nghien-cuu-thi-truong")
async def cmd_nghien_cuu_thi_truong(request: CommandRequest):
    """§3 Market Research via CommandController"""
    return await command_controller.execute_command("nghien-cuu-thi-truong", request)

@router.post("/nhan-dien-thuong-hieu")
async def cmd_nhan_dien_thuong_hieu(request: CommandRequest):
    """§4 Brand Identity via CommandController"""
    return await command_controller.execute_command("nhan-dien-thuong-hieu", request)

@router.post("/thong-diep-tiep-thi")
async def cmd_thong_diep_tiep_thi(request: CommandRequest):
    """§5 Marketing Message via CommandController"""
    return await command_controller.execute_command("thong-diep-tiep-thi", request)

@router.post("/ke-hoach-tiep-thi")
async def cmd_ke_hoach_tiep_thi(request: CommandRequest):
    """§6 Marketing Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-tiep-thi", request)

@router.post("/noi-dung-tiep-thi")
async def cmd_noi_dung_tiep_thi(request: CommandRequest):
    """§7 Marketing Content via CommandController"""
    return await command_controller.execute_command("noi-dung-tiep-thi", request)

@router.post("/y-tuong-social-media")
async def cmd_y_tuong_social_media(request: CommandRequest):
    """§8 Social Media Content via CommandController"""
    return await command_controller.execute_command("y-tuong-social-media", request)

@router.post("/chien-luoc-ban-hang")
async def cmd_chien_luoc_ban_hang(request: CommandRequest):
    """§9 Sales Strategy via CommandController"""
    return await command_controller.execute_command("chien-luoc-ban-hang", request)

@router.post("/ke-hoach-pr")
async def cmd_ke_hoach_pr(request: CommandRequest):
    """§10 PR Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-pr", request)

@router.post("/ke-hoach-tang-truong")
async def cmd_ke_hoach_tang_truong(request: CommandRequest):
    """§11 Growth Plan via CommandController"""
    return await command_controller.execute_command("ke-hoach-tang-truong", request)

@router.post("/nong-san")
async def cmd_nong_san(request: CommandRequest):
    """Local Market via CommandController"""
    return await command_controller.execute_command("nong-san", request)

@router.post("/ban-hang")
async def cmd_ban_hang(request: CommandRequest):
    """Sales Ops via CommandController"""
    return await command_controller.execute_command("ban-hang", request)

@router.post("/tiep-thi")
async def cmd_tiep_thi(request: CommandRequest):
    """Marketing Ops via CommandController"""
    return await command_controller.execute_command("tiep-thi", request)
