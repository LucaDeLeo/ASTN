<script lang="ts">
  import { page } from '$app/state'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    Copy,
    Globe,
    ImagePlus,
    Mail,
    Plus,
    Trash2,
    Upload,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import AdminSection from '~/components/org-admin/core/AdminSection.svelte'

  type SocialLink = {
    platform: string
    url: string
  }

  const SOCIAL_PLATFORMS = [
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'github', label: 'GitHub' },
    { value: 'discord', label: 'Discord' },
    { value: 'other', label: 'Other' },
  ]

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  let description = $state('')
  let contactEmail = $state('')
  let website = $state('')
  let socialLinks = $state<SocialLink[]>([])
  let initialized = $state(false)

  let savingDetails = $state(false)
  let savingSocial = $state(false)
  let uploadingLogo = $state(false)
  let removingLogo = $state(false)
  let creatingInvite = $state(false)
  let revokingInviteId = $state<Id<'orgInviteLinks'> | null>(null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const orgProfile = useQuery(api.orgs.admin.getOrgProfile, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const inviteLinks = useQuery(api.orgs.admin.getInviteLinks, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const adminState = $derived.by(() => {
    if (org.isLoading || membership.isLoading) return 'loading'
    if (!org.data) return 'missing'
    if (membership.data?.role !== 'admin') return 'forbidden'
    return 'ready'
  })

  $effect(() => {
    if (orgProfile.data && !initialized) {
      description = orgProfile.data.description ?? ''
      contactEmail = orgProfile.data.contactEmail ?? ''
      website = orgProfile.data.website ?? ''
      socialLinks = [...(orgProfile.data.socialLinks ?? [])]
      initialized = true
    }
  })

  const addSocialLink = () => {
    socialLinks = [...socialLinks, { platform: 'twitter', url: '' }]
  }

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => {
    socialLinks = socialLinks.map((link, currentIndex) =>
      currentIndex === index ? { ...link, [field]: value } : link,
    )
  }

  const removeSocialLink = (index: number) => {
    socialLinks = socialLinks.filter((_, currentIndex) => currentIndex !== index)
  }

  const saveDetails = async () => {
    if (!org.data) return

    try {
      savingDetails = true
      await convex.mutation(api.orgs.admin.updateOrgProfile, {
        orgId: org.data._id,
        description: description.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        website: website.trim() || undefined,
      })
      toast.success('Organization details saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save details')
    } finally {
      savingDetails = false
    }
  }

  const saveSocial = async () => {
    if (!org.data) return

    try {
      savingSocial = true
      await convex.mutation(api.orgs.admin.updateOrgProfile, {
        orgId: org.data._id,
        socialLinks: socialLinks
          .map((link) => ({
            platform: link.platform.trim(),
            url: link.url.trim(),
          }))
          .filter((link) => link.platform && link.url),
      })
      toast.success('Social links saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save social links')
    } finally {
      savingSocial = false
    }
  }

  const uploadLogo = async (event: Event) => {
    if (!org.data) return

    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be 5MB or smaller')
      input.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      input.value = ''
      return
    }

    try {
      uploadingLogo = true
      const uploadUrl = await convex.mutation(api.upload.generateUploadUrl, {})

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const payload = await response.json()

      await convex.mutation(api.orgs.admin.saveOrgLogo, {
        orgId: org.data._id,
        storageId: payload.storageId,
      })

      toast.success('Logo uploaded')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload logo')
    } finally {
      uploadingLogo = false
      input.value = ''
    }
  }

  const removeLogo = async () => {
    if (!org.data) return

    try {
      removingLogo = true
      await convex.mutation(api.orgs.admin.removeOrgLogo, {
        orgId: org.data._id,
      })
      toast.success('Logo removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove logo')
    } finally {
      removingLogo = false
    }
  }

  const createInviteLink = async () => {
    if (!org.data || !slug) return

    try {
      creatingInvite = true
      const result = await convex.mutation(api.orgs.admin.getOrCreateInviteLink, {
        orgId: org.data._id,
      })
      await navigator.clipboard.writeText(
        `${window.location.origin}/org/${slug}/join?token=${result.token}`,
      )
      toast.success('Invite link created and copied')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invite link')
    } finally {
      creatingInvite = false
    }
  }

  const copyInviteLink = async (token: string) => {
    if (!slug) return

    await navigator.clipboard.writeText(
      `${window.location.origin}/org/${slug}/join?token=${token}`,
    )
    toast.success('Invite link copied')
  }

  const revokeInviteLink = async (inviteLinkId: Id<'orgInviteLinks'>) => {
    try {
      revokingInviteId = inviteLinkId
      await convex.mutation(api.orgs.admin.revokeInviteLink, {
        inviteLinkId,
      })
      toast.success('Invite link revoked')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke invite link')
    } finally {
      revokingInviteId = null
    }
  }
</script>

{#if adminState === 'loading'}
  <div class="space-y-6">
    <div class="h-32 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
    <div class="h-72 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
  </div>
{:else if adminState === 'missing'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
    <p class="mt-3 text-sm text-slate-600">There is no organization attached to this admin setup page.</p>
  </div>
{:else if adminState === 'forbidden'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Admin access required</h1>
    <p class="mt-3 text-sm text-slate-600">You need admin permissions to change organization setup.</p>
  </div>
{:else}
  <div class="space-y-6">
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">Setup</p>
      <h1 class="mt-2 font-display text-3xl text-slate-950">Organization setup</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Keep the public organization page accurate, make invites shareable, and
        set a clear first impression for applicants and members.
      </p>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <AdminSection
        title="Branding"
        subtitle="Upload a recognizable logo for the directory and org page."
      >
        <div class="space-y-5">
          <div class="flex items-center gap-4">
            {#if orgProfile.data?.resolvedLogoUrl}
              <img
                src={orgProfile.data.resolvedLogoUrl}
                alt={org.data?.name}
                class="size-20 rounded-3xl object-cover"
              />
            {:else}
              <div class="flex size-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
                <ImagePlus class="size-8" />
              </div>
            {/if}

            <div class="space-y-3">
              <label class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <Upload class="size-4" />
                <span>{uploadingLogo ? 'Uploading…' : 'Upload logo'}</span>
                <input type="file" accept="image/*" class="hidden" onchange={uploadLogo} disabled={uploadingLogo} />
              </label>

              {#if orgProfile.data?.resolvedLogoUrl}
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                  onclick={removeLogo}
                  disabled={removingLogo}
                >
                  <Trash2 class="size-4" />
                  <span>{removingLogo ? 'Removing…' : 'Remove logo'}</span>
                </button>
              {/if}
            </div>
          </div>

          <p class="text-sm text-slate-600">
            Use a square image where possible. The logo appears across the directory,
            public org page, and internal admin surfaces.
          </p>
        </div>
      </AdminSection>

      <AdminSection
        title="Invite links"
        subtitle="Create and distribute links for new members to join the organization."
      >
        {#snippet actions()}
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            onclick={createInviteLink}
            disabled={creatingInvite}
          >
            <Plus class="size-4" />
            <span>{creatingInvite ? 'Creating…' : 'New invite link'}</span>
          </button>
        {/snippet}
        {#if inviteLinks.data?.length}
          <div class="space-y-3">
            {#each inviteLinks.data as link}
              <div class="flex flex-col gap-3 rounded-2xl border border-border bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-slate-900">Invite token</p>
                  <p class="mt-1 truncate font-mono text-xs text-slate-500">{link.token}</p>
                  <p class="mt-2 text-xs text-slate-500">
                    Created {new Date(link.createdAt).toLocaleDateString()}
                    {#if link.expiresAt}
                      · Expires {new Date(link.expiresAt).toLocaleDateString()}
                    {/if}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-slate-700 transition hover:bg-white"
                    onclick={() => copyInviteLink(link.token)}
                  >
                    <Copy class="size-4" />
                    Copy
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                    onclick={() => revokeInviteLink(link._id)}
                    disabled={revokingInviteId === link._id}
                  >
                    <Trash2 class="size-4" />
                    Revoke
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-sm text-slate-500">No active invite links yet.</p>
        {/if}
      </AdminSection>
    </div>

    <AdminSection
      title="Organization details"
      subtitle="These fields shape the public org listing and contact path."
    >
      {#snippet actions()}
        <button
          type="button"
          class="rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:opacity-60"
          onclick={saveDetails}
          disabled={savingDetails}
        >
          {savingDetails ? 'Saving…' : 'Save details'}
        </button>
      {/snippet}
      <div class="grid gap-5 md:grid-cols-2">
        <label class="space-y-2 md:col-span-2">
          <span class="text-sm font-medium text-slate-900">Description</span>
          <textarea
            class="min-h-40 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
            bind:value={description}
            placeholder="What is this organization about? Who should join? What makes it distinctive?"
          ></textarea>
        </label>

        <label class="space-y-2">
          <span class="text-sm font-medium text-slate-900">Contact email</span>
          <div class="relative">
            <Mail class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full rounded-2xl border border-border bg-white px-10 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
              bind:value={contactEmail}
              type="email"
              placeholder="team@example.org"
            />
          </div>
        </label>

        <label class="space-y-2">
          <span class="text-sm font-medium text-slate-900">Website</span>
          <div class="relative">
            <Globe class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full rounded-2xl border border-border bg-white px-10 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
              bind:value={website}
              type="url"
              placeholder="https://example.org"
            />
          </div>
        </label>
      </div>
    </AdminSection>

    <AdminSection
      title="Social links"
      subtitle="Add the channels applicants and members should actually use."
    >
      {#snippet actions()}
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onclick={addSocialLink}
          >
            Add link
          </button>
          <button
            type="button"
            class="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            onclick={saveSocial}
            disabled={savingSocial}
          >
            {savingSocial ? 'Saving…' : 'Save links'}
          </button>
        </div>
      {/snippet}
      {#if socialLinks.length}
        <div class="space-y-3">
          {#each socialLinks as socialLink, index (index)}
            <div class="grid gap-3 rounded-2xl border border-border bg-slate-50 p-4 md:grid-cols-[180px_minmax(0,1fr)_auto] md:items-center">
              <label class="space-y-2">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Platform</span>
                <select
                  class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                  value={socialLink.platform}
                  onchange={(event) =>
                    updateSocialLink(index, 'platform', (event.currentTarget as HTMLSelectElement).value)}
                >
                  {#each SOCIAL_PLATFORMS as platform}
                    <option value={platform.value}>{platform.label}</option>
                  {/each}
                </select>
              </label>

              <label class="space-y-2">
                <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">URL</span>
                <input
                  class="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                  value={socialLink.url}
                  oninput={(event) =>
                    updateSocialLink(index, 'url', (event.currentTarget as HTMLInputElement).value)}
                  placeholder="https://"
                />
              </label>

              <button
                type="button"
                class="inline-flex items-center justify-center rounded-xl border border-rose-200 px-3 py-2.5 text-sm text-rose-700 transition hover:bg-rose-50"
                onclick={() => removeSocialLink(index)}
              >
                <Trash2 class="size-4" />
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-slate-500">No social links configured yet.</p>
      {/if}
    </AdminSection>
  </div>
{/if}
