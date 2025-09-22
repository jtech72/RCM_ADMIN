/**
 * Test utility for contractUploadS3 function
 * This can be used to manually test the file upload functionality
 */

const { contractUploadS3, deleteFile } = require('../services/s3Service');
const fs = require('fs');
const path = require('path');

/**
 * Test the contractUploadS3 function with a sample file
 */
async function testFileUpload() {
    try {
        console.log('🧪 Testing contractUploadS3 function...\n');

        // Create a test file buffer
        const testContent = 'This is a test file for S3 upload functionality.\nCreated at: ' + new Date().toISOString();
        const fileBuffer = Buffer.from(testContent);

        console.log('📄 Test file details:');
        console.log(`   Size: ${fileBuffer.length} bytes`);
        console.log(`   Content: ${testContent.substring(0, 50)}...`);

        // Test parameters
        const uploadParams = {
            fileBuffer,
            fileName: 'test-upload.txt',
            contentType: 'text/plain',
            folder: 'test-uploads',
            metadata: {
                testRun: 'true',
                timestamp: Date.now().toString(),
                purpose: 'backend-testing'
            }
        };

        console.log('\n⬆️  Uploading file to S3...');
        const uploadResult = await contractUploadS3(uploadParams);

        if (uploadResult.success) {
            console.log('✅ Upload successful!');
            console.log('📍 File details:');
            console.log(`   File Key: ${uploadResult.data.fileKey}`);
            console.log(`   File URL: ${uploadResult.data.fileUrl}`);
            console.log(`   S3 Location: ${uploadResult.data.s3Location}`);
            console.log(`   File Size: ${uploadResult.data.fileSize} bytes`);
            console.log(`   Content Type: ${uploadResult.data.contentType}`);
            console.log(`   Uploaded At: ${uploadResult.data.uploadedAt}`);
            console.log(`   Metadata:`, uploadResult.data.metadata);

            // Test file deletion
            console.log('\n🗑️  Testing file deletion...');
            const deleteResult = await deleteFile(uploadResult.data.fileKey);

            if (deleteResult.success) {
                console.log('✅ File deleted successfully!');
                console.log(`   Deleted At: ${deleteResult.data.deletedAt}`);
            } else {
                console.log('❌ File deletion failed:', deleteResult.error);
            }

        } else {
            console.log('❌ Upload failed:', uploadResult.error);
            if (uploadResult.details) {
                console.log('📋 Error details:', uploadResult.details);
            }
        }

    } catch (error) {
        console.error('💥 Test failed with error:', error.message);
    }
}

/**
 * Test file validation
 */
async function testFileValidation() {
    console.log('\n🔍 Testing file validation...\n');

    const testCases = [
        {
            name: 'Valid JPEG image',
            fileName: 'test.jpg',
            contentType: 'image/jpeg',
            fileSize: 1024 * 1024, // 1MB
            shouldPass: true
        },
        {
            name: 'Invalid file type',
            fileName: 'malware.exe',
            contentType: 'application/exe',
            fileSize: 1024,
            shouldPass: false
        },
        {
            name: 'Oversized image',
            fileName: 'huge-image.jpg',
            contentType: 'image/jpeg',
            fileSize: 10 * 1024 * 1024, // 10MB (exceeds 5MB limit)
            shouldPass: false
        },
        {
            name: 'Valid PDF',
            fileName: 'document.pdf',
            contentType: 'application/pdf',
            fileSize: 2 * 1024 * 1024, // 2MB
            shouldPass: true
        }
    ];

    for (const testCase of testCases) {
        console.log(`Testing: ${testCase.name}`);

        const fileBuffer = Buffer.alloc(testCase.fileSize);
        const result = await contractUploadS3({
            fileBuffer,
            fileName: testCase.fileName,
            contentType: testCase.contentType,
            folder: 'validation-tests'
        });

        const passed = result.success === testCase.shouldPass;
        console.log(`   ${passed ? '✅' : '❌'} ${passed ? 'PASS' : 'FAIL'}: ${result.success ? 'Upload succeeded' : result.error}`);

        // Clean up successful uploads
        if (result.success && result.data.fileKey) {
            await deleteFile(result.data.fileKey);
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    console.log('🚀 Starting S3 Upload Tests\n');
    console.log('='.repeat(60));

    testFileUpload()
        .then(() => testFileValidation())
        .then(() => {
            console.log('\n' + '='.repeat(60));
            console.log('🎉 All tests completed!');
        })
        .catch(error => {
            console.error('\n💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = {
    testFileUpload,
    testFileValidation
};