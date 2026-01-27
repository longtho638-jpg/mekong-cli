import { MultipartUploader } from '../../src/lib/multipart-uploader';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MultipartUploader', () => {
  let file: File;

  beforeEach(() => {
    file = new File(['test content'.repeat(1000)], 'test.txt', { type: 'text/plain' });
    jest.clearAllMocks();
  });

  it('should initiate, upload parts, and complete upload successfully', async () => {
    // Mock Initiate
    mockedAxios.post.mockResolvedValueOnce({
      data: { UploadId: 'upload-id-123', Key: 'uploads/test.txt' }
    });

    // Mock Upload Part Presigned URL
    mockedAxios.post.mockResolvedValueOnce({
      data: { url: 'https://s3.amazonaws.com/presigned-url-part-1' }
    });

    // Mock Upload Part to S3
    mockedAxios.put.mockResolvedValueOnce({
      headers: { etag: '"etag-123"' }
    });

    // Mock Complete
    mockedAxios.post.mockResolvedValueOnce({
      data: { Location: 'https://s3.amazonaws.com/uploads/test.txt', Key: 'uploads/test.txt' }
    });

    const uploader = new MultipartUploader({ file });
    const result = await uploader.start();

    expect(mockedAxios.post).toHaveBeenCalledTimes(3); // initiate, get-url, complete
    expect(mockedAxios.put).toHaveBeenCalledTimes(1); // upload to s3
    expect(result).toEqual({ location: 'https://s3.amazonaws.com/uploads/test.txt', key: 'uploads/test.txt' });
  });

  it('should abort upload on failure', async () => {
    // Mock Initiate
    mockedAxios.post.mockResolvedValueOnce({
      data: { UploadId: 'upload-id-123', Key: 'uploads/test.txt' }
    });

    // Mock Upload Part Presigned URL failure
    mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

    // Mock Abort (should be called)
    mockedAxios.post.mockResolvedValueOnce({});

    const uploader = new MultipartUploader({ file, maxRetries: 0 }); // 0 retries to fail fast

    await expect(uploader.start()).rejects.toThrow('Network Error');

    // Check if abort was called
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/multipart/abort', expect.objectContaining({
        uploadId: 'upload-id-123',
        key: 'uploads/test.txt'
    }));
  });
});
