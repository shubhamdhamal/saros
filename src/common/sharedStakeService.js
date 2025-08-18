import { PublicKey, Transaction } from '@solana/web3.js';
import { SolanaService } from './solana.js';
import { TokenProgramService } from '../TokenProgramService';
import { SarosFarmInstructionService } from '../farm/sarosFarmServiceIntructions';

export class SharedStakeService {
  static async createStakeTransaction(
    connection,
    payerAccount,
    poolAddress,
    amount,
    sarosFarmProgramAddress,
    rewards = [],
    lpAddress
  ) {
    try {
      const userStakingTokenAddress =
        await TokenProgramService.findAssociatedTokenAddress(
          payerAccount.publicKey,
          lpAddress
        );
      
      const [userPoolAddress, userPoolNonce] = await this.findUserPoolAddress(
        payerAccount.publicKey,
        poolAddress,
        sarosFarmProgramAddress
      );

      const transaction = new Transaction();

      // Create associated token account if needed
      if (
        !userStakingTokenAddress ||
        (await SolanaService.isAddressAvailable(
          connection,
          userStakingTokenAddress
        ))
      ) {
        const createATAInstruction =
          TokenProgramService.createAssociatedTokenAccount(
            payerAccount.publicKey,
            payerAccount.publicKey,
            new PublicKey(lpAddress)
          );
        transaction.add(createATAInstruction);
      }

      // Create user pool if needed
      if (await SolanaService.isAddressAvailable(connection, userPoolAddress)) {
        const createUserPoolInstruction =
          SarosFarmInstructionService.createUserPoolInstruction(
            payerAccount.publicKey,
            poolAddress,
            userPoolAddress,
            userPoolNonce,
            sarosFarmProgramAddress
          );
        transaction.add(createUserPoolInstruction);
      }

      // Add stake instruction
      const stakePoolInstruction =
        SarosFarmInstructionService.stakePoolInstruction(
          poolAddress,
          poolAddress, // pool.stakingTokenAccount will be passed from caller
          payerAccount.publicKey,
          userPoolAddress,
          userStakingTokenAddress,
          amount,
          sarosFarmProgramAddress
        );

      transaction.add(stakePoolInstruction);

      // Handle rewards
      await Promise.all(
        rewards.map(async (reward) => {
          const { poolRewardAddress } = reward;
          await this.stakePoolReward(
            connection,
            payerAccount,
            poolAddress,
            new PublicKey(poolRewardAddress),
            sarosFarmProgramAddress,
            transaction
          );
        })
      );

      return { transaction, userPoolAddress, userStakingTokenAddress };
    } catch (err) {
      throw new Error(`Failed to create stake transaction: ${err.message}`);
    }
  }

  static async findUserPoolAddress(
    ownerAddress,
    poolAddress,
    sarosFarmProgramAddress
  ) {
    return PublicKey.findProgramAddress(
      [ownerAddress.toBytes(), poolAddress.toBytes()],
      sarosFarmProgramAddress
    );
  }

  static async stakePoolReward(
    connection,
    payerAccount,
    poolAddress,
    poolRewardAddress,
    sarosFarmProgramAddress,
    transaction
  ) {
    const [userPoolRewardAddress, userPoolRewardNonce] =
      await this.findUserPoolRewardAddress(
        payerAccount.publicKey,
        poolRewardAddress,
        sarosFarmProgramAddress
      );

    if (await SolanaService.isAddressAvailable(connection, userPoolRewardAddress)) {
      const createUserPoolRewardInstruction =
        SarosFarmInstructionService.createUserPoolRewardInstruction(
          payerAccount.publicKey,
          poolRewardAddress,
          userPoolRewardAddress,
          userPoolRewardNonce,
          sarosFarmProgramAddress
        );
      transaction.add(createUserPoolRewardInstruction);
    }

    const stakePoolRewardInstruction =
      SarosFarmInstructionService.stakePoolRewardInstruction(
        poolAddress,
        poolRewardAddress,
        payerAccount.publicKey,
        userPoolRewardAddress,
        sarosFarmProgramAddress
      );

    transaction.add(stakePoolRewardInstruction);
  }

  static async findUserPoolRewardAddress(
    ownerAddress,
    poolRewardAddress,
    sarosFarmProgramAddress
  ) {
    return PublicKey.findProgramAddress(
      [ownerAddress.toBytes(), poolRewardAddress.toBytes()],
      sarosFarmProgramAddress
    );
  }
}
