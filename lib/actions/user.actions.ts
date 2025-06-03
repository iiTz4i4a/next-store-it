'use server'

// TODO: Create account flow 
// 1. User enters full name and email
// 2. Check if the use already exist using the email
// 3. Send OTP to user's email
// 4. This will send a secret key for creating a session.
// 5. Create a new user document if the user is a new user.
// 6. Return the user's accountID 
// 7.Verify OTP and authenticate to login

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

const getUserByEmail = async (email: string) => {
  const { databases } = await createAdminClient();

  const result = await databases.listDocuments(
    appwriteConfig.databaseId,
    appwriteConfig.userCollectionId,
    [Query.equal("email", [email])],
  );

  return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown, message: string) => {
  console.log(error, message)
  throw error
}

const sendEmailOTP = async ({ email }: { email: string }) => {
  const { account } = await createAdminClient();

  try {
    const session = await account.createEmailToken(ID.unique(), email)
    return session.userId
  } catch (error) {
    handleError(error, "Failed to send email OTP")
  }
}
export const createAccount = async ({
  fullName,
  email
}: {
  fullName: String;
  email: string
}) => {
  const existingUser = await getUserByEmail(email);

  const accountId = await sendEmailOTP({ email })

  if (!accountId) {
    throw new Error("Failed to send an OTP");
  }
  if (!existingUser) {
    const { databases } = await createAdminClient();

    await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        fullName,
        email,
        avatar: "https://avatar.iran.liara.run/public/41",
        accountId
      }
    )
  }
  return parseStringify({ accountId })
}
