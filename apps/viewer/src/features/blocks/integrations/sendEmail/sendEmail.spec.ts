import test, { expect } from '@playwright/test'
import { createSmtpCredentials } from '../../../../test/utils/databaseActions'
import { createId } from '@paralleldrive/cuid2'
import { SmtpCredentialsData } from 'models'
import { importTypebotInDatabase } from 'utils/playwright/databaseActions'
import { typebotViewer } from 'utils/playwright/testHelpers'
import { getTestAsset } from '@/test/utils/playwright'

export const mockSmtpCredentials: SmtpCredentialsData = {
  from: {
    email: 'sunny.cremin66@ethereal.email',
    name: 'Sunny Cremin',
  },
  host: 'smtp.ethereal.email',
  port: 587,
  username: 'sunny.cremin66@ethereal.email',
  password: 'yJDHkf2bYbNydaRvTq',
}

test.beforeAll(async () => {
  try {
    const credentialsId = 'send-email-credentials'
    await createSmtpCredentials(credentialsId, mockSmtpCredentials)
  } catch (err) {
    console.error(err)
  }
})

test('should send an email', async ({ page }) => {
  const typebotId = createId()
  await importTypebotInDatabase(getTestAsset('typebots/sendEmail.json'), {
    id: typebotId,
    publicId: `${typebotId}-public`,
  })
  await page.goto(`/${typebotId}-public`)
  const [response] = await Promise.all([
    page.waitForResponse((resp) =>
      resp.request().url().includes(`integrations/email`)
    ),
    typebotViewer(page).locator('text=Send email').click(),
  ])
  const { previewUrl } = await response.json()
  await page.goto(previewUrl)
  await expect(page.locator('text="Hey!"')).toBeVisible()
  await expect(
    page.locator(`text="${mockSmtpCredentials.from.name}"`)
  ).toBeVisible()
  await expect(page.locator('text="<test1@gmail.com>" >> nth=0')).toBeVisible()
  await expect(page.locator('text="<test2@gmail.com>" >> nth=0')).toBeVisible()
  await expect(
    page.locator('text="<baptiste.arnaud95@gmail.com>" >> nth=0')
  ).toBeVisible()
  await page.goto(`${process.env.NEXTAUTH_URL}/typebots/${typebotId}/results`)
  await page.click('text="See logs"')
  await expect(page.locator('text="Email successfully sent"')).toBeVisible()
})
