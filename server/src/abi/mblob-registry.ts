export const mblobRegistryAbi = [
  {
    type: 'function',
    name: 'getBlob',
    stateMutability: 'view',
    inputs: [{ name: 'blobId', type: 'uint256' }],
    outputs: [
      {
        name: 'blob',
        type: 'tuple',
        components: [
          { name: 'owner', type: 'address' },
          { name: 'fileHash', type: 'bytes32' },
          { name: 'encryptionMetadataHash', type: 'bytes32' },
          { name: 'storageNodesCommitment', type: 'bytes32' },
          { name: 'fileSizeBytes', type: 'uint64' },
          { name: 'createdAt', type: 'uint64' },
          { name: 'expiresAt', type: 'uint64' },
          { name: 'replicationFactor', type: 'uint8' },
          { name: 'deletable', type: 'bool' },
          { name: 'status', type: 'uint8' },
          { name: 'payment', type: 'uint256' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'activateBlob',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'blobId', type: 'uint256' },
      { name: 'storageNodesCommitment', type: 'bytes32' }
    ],
    outputs: []
  }
] as const
