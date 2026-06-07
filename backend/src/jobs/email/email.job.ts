
export const handleEmail = async (data: EmailData) => {
  try {
    await sendMail(data.receiver);
  } catch (error) {
    logger.error(`Error pdf processor: ${error.message}`);
  }
};