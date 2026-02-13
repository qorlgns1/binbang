-- AddForeignKey
ALTER TABLE "CaseMessage" ADD CONSTRAINT "CaseMessage_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
