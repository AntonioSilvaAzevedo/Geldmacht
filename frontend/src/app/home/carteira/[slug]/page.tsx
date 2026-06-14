import { redirect } from 'next/navigation'

interface InstitutionIndexPageProps {
  params: Promise<{ slug: string }>
}

export default async function InstitutionIndexPage({
  params,
}: InstitutionIndexPageProps) {
  const { slug } = await params
  redirect(`/home/carteira/${slug}/resumo`)
}
