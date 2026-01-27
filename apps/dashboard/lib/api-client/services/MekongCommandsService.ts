/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { backend__models__command__CommandRequest } from '../models/backend__models__command__CommandRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class MekongCommandsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Cmd Khach Hang
     * §1 Customer Profile via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdKhachHangApiCommandsKhachHangPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/khach-hang',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Ke Hoach Kinh Doanh
     * §2 Business Plan via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdKeHoachKinhDoanhApiCommandsKeHoachKinhDoanhPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/ke-hoach-kinh-doanh',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Nghien Cuu Thi Truong
     * §3 Market Research via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdNghienCuuThiTruongApiCommandsNghienCuuThiTruongPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/nghien-cuu-thi-truong',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Nhan Dien Thuong Hieu
     * §4 Brand Identity via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdNhanDienThuongHieuApiCommandsNhanDienThuongHieuPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/nhan-dien-thuong-hieu',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Thong Diep Tiep Thi
     * §5 Marketing Message via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdThongDiepTiepThiApiCommandsThongDiepTiepThiPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/thong-diep-tiep-thi',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Ke Hoach Tiep Thi
     * §6 Marketing Plan via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdKeHoachTiepThiApiCommandsKeHoachTiepThiPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/ke-hoach-tiep-thi',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Noi Dung Tiep Thi
     * §7 Marketing Content via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdNoiDungTiepThiApiCommandsNoiDungTiepThiPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/noi-dung-tiep-thi',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Y Tuong Social Media
     * §8 Social Media Content via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdYTuongSocialMediaApiCommandsYTuongSocialMediaPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/y-tuong-social-media',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Chien Luoc Ban Hang
     * §9 Sales Strategy via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdChienLuocBanHangApiCommandsChienLuocBanHangPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/chien-luoc-ban-hang',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Ke Hoach Pr
     * §10 PR Plan via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdKeHoachPrApiCommandsKeHoachPrPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/ke-hoach-pr',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Ke Hoach Tang Truong
     * §11 Growth Plan via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdKeHoachTangTruongApiCommandsKeHoachTangTruongPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/ke-hoach-tang-truong',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Nong San
     * Local Market via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdNongSanApiCommandsNongSanPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/nong-san',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Ban Hang
     * Sales Ops via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdBanHangApiCommandsBanHangPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/ban-hang',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Cmd Tiep Thi
     * Marketing Ops via CommandController
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public cmdTiepThiApiCommandsTiepThiPost(
        requestBody: backend__models__command__CommandRequest,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/commands/tiep-thi',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
