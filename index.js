const S3 = require('aws-sdk/clients/s3')
const core = require('@actions/core')

const aws_key_id = core.getInput('aws_key_id', {
  required: true
})
const aws_secret_key = core.getInput('aws_secret_key', {
  required: true
})
const s3_bucket = core.getInput('s3_bucket', {
  required: true
})
const s3_dir = core.getInput('s3_dir', {
  required: true
})

async function s3DeleteDir(params) {
  const s3 = new S3({
    accessKeyId: aws_key_id,
    secretAccessKey: aws_secret_key
  })

  const list = await s3.listObjects(params).promise()
  const result = { deletedCount: 0 }
  if (!list.Contents) return result

  const isDirEmpty = !list.Contents.length
  if (isDirEmpty) {
    await s3
      .deleteObject({
        Bucket: params.Bucket,
        Key: params.Prefix
      })
      .promise()

    return result
  }

  const deleteParams = {
    Bucket: params.Bucket,
    Delete: { Objects: [] }
  }

  list.Contents.forEach(({ Key }) => {
    if (!Key) return null
    deleteParams.Delete.Objects.push({ Key })
  })

  const deleteResponse = await s3.deleteObjects(deleteParams).promise()
  result.deletedCount += deleteResponse.Deleted ? deleteResponse.Deleted.length : 0

  const recursiveResult = await s3DeleteDir(params)
  result.deletedCount += recursiveResult.deletedCount

  return result
}

const params = {
  Bucket: s3_bucket,
  Prefix: s3_dir
}

s3DeleteDir(params)
