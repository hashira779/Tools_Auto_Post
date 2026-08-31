import React, { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'
import { Box } from './ui/box'
import { HStack } from './ui/hstack'
import { VStack } from './ui/vstack'
import { Text } from './ui/text'
import { Heading } from './ui/heading'
import { Button, ButtonText, ButtonSpinner, ButtonIcon } from './ui/button'
import { Input, InputField } from './ui/input'
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from './ui/checkbox'
import { Card } from './ui/card'
import { Badge, BadgeText } from './ui/badge'
import { CheckIcon, KeyIcon, ClockIcon, TrashIcon, AlertCircleIcon, ShieldIcon, CalendarIcon } from 'lucide-react-native'
import { Spinner } from './ui/spinner'

const isExpired = (t) =>
  t.valid_until && new Date(t.valid_until) < new Date()

export default function TokenManager() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Create form
  const [description, setDescription] = useState('')
  const [validDays, setValidDays] = useState('30')
  const [maxUses, setMaxUses] = useState('1')
  const [unlimited, setUnlimited] = useState(false)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTokens(await adminApi.listTokens())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setCreating(true)
    setError('')
    try {
      await adminApi.createToken({
        description: description || null,
        valid_days: unlimited ? null : Number(validDays),
        max_uses: Number(maxUses),
        is_unlimited: unlimited,
      })
      setDescription('')
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (t) => {
    setError('')
    try {
      await adminApi.setTokenActive(t.id, !t.is_active)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const remove = async (t) => {
    if (!window.confirm(`Permanently delete token ${t.token_key}?`)) return
    setError('')
    try {
      await adminApi.deleteToken(t.id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <Box className="flex-col lg:flex-row gap-8">
      <Box className="lg:w-1/3">
        <Card variant="outline" className="p-6 bg-background-900 border-border-800 shadow-hard-2">
          <VStack space="xl">
            <HStack space="md" alignItems="center">
              <Box className="p-2 bg-primary-900/40 border border-primary-500/30 rounded-full">
                <ShieldIcon size={24} className="text-primary-400" />
              </Box>
              <Heading size="xl" className="text-typography-100">Generate Token</Heading>
            </HStack>

            <VStack space="md">
              <VStack space="xs">
                <Text size="sm" className="font-bold text-typography-400">DESCRIPTION</Text>
                <Input variant="outline" size="md">
                  <InputField 
                    placeholder="e.g. VIP Partner access" 
                    value={description}
                    onChangeText={setDescription}
                  />
                </Input>
              </VStack>

              <Checkbox 
                size="md" 
                isInvalid={false} 
                isDisabled={false} 
                value="unlimited" 
                isChecked={unlimited}
                onChange={setUnlimited}
              >
                <CheckboxIndicator mr="$2">
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel>Unlimited usage / never expires</CheckboxLabel>
              </Checkbox>

              {!unlimited && (
                <HStack space="md">
                  <VStack space="xs" className="flex-1">
                    <Text size="sm" className="font-bold text-typography-400">VALID DAYS</Text>
                    <Input variant="outline" size="md">
                      <InputField 
                        keyboardType="numeric"
                        value={validDays}
                        onChangeText={setValidDays}
                      />
                    </Input>
                  </VStack>
                  <VStack space="xs" className="flex-1">
                    <Text size="sm" className="font-bold text-typography-400">MAX USES</Text>
                    <Input variant="outline" size="md">
                      <InputField 
                        keyboardType="numeric"
                        value={maxUses}
                        onChangeText={setMaxUses}
                      />
                    </Input>
                  </VStack>
                </HStack>
              )}

              <Button 
                size="lg" 
                variant="solid" 
                action="primary" 
                isDisabled={creating} 
                onPress={handleCreate}
                className="mt-4"
              >
                {creating && <ButtonSpinner mr="$2" />}
                <ButtonText>{creating ? 'Generating...' : 'Generate Token'}</ButtonText>
              </Button>
            </VStack>
          </VStack>
        </Card>
      </Box>

      <Box className="lg:w-2/3">
        <VStack space="md">
          {error ? (
            <Box className="bg-error-500/10 border border-error-500/30 p-4 rounded-xl flex-row items-center gap-3">
              <AlertCircleIcon size={20} className="text-error-500" />
              <Text className="text-error-500">{error}</Text>
            </Box>
          ) : null}

          {loading ? (
            <Box className="py-20 items-center justify-center">
              <Spinner size="large" />
              <Text className="mt-4 text-typography-400 tracking-widest uppercase text-sm">Loading Tokens...</Text>
            </Box>
          ) : tokens.length === 0 ? (
            <Card variant="outline" className="p-16 items-center justify-center border-dashed border-border-700 bg-transparent">
              <KeyIcon size={48} className="text-typography-500 mb-4" />
              <Text className="text-typography-400">No tokens generated yet.</Text>
            </Card>
          ) : (
            tokens.map((t, i) => {
              const expired = isExpired(t)
              const limitReached = t.max_uses > 0 && t.current_uses >= t.max_uses
              
              return (
                <Card key={t.id} variant="outline" className="p-5 bg-background-900 border-border-800 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <VStack space="sm" className="flex-1">
                    <HStack space="md" alignItems="center" flexWrap="wrap">
                      <Box className="px-3 py-1 bg-primary-900/30 border border-primary-500/20 rounded-lg">
                        <Text className="font-mono font-bold text-primary-300">{t.token_key}</Text>
                      </Box>
                      
                      {!t.is_active ? (
                        <Badge size="md" variant="solid" action="muted"><BadgeText>Disabled</BadgeText></Badge>
                      ) : expired ? (
                        <Badge size="md" variant="solid" action="error"><BadgeText>Expired</BadgeText></Badge>
                      ) : limitReached ? (
                        <Badge size="md" variant="solid" action="warning"><BadgeText>Limit Reached</BadgeText></Badge>
                      ) : (
                        <Badge size="md" variant="solid" action="info"><BadgeText>Active</BadgeText></Badge>
                      )}
                    </HStack>
                    
                    <Text className="text-typography-300 font-medium">
                      {t.description || <Text className="italic text-typography-500">No description provided</Text>}
                    </Text>
                    
                    <HStack space="xl" flexWrap="wrap">
                      <HStack space="xs" alignItems="center">
                        <ShieldIcon size={14} className="text-typography-500" />
                        <Text size="xs" className="text-typography-400 font-medium">
                          <Text size="xs" className="text-typography-200">{t.current_uses}</Text> / {t.max_uses === 0 ? '∞' : t.max_uses} uses
                        </Text>
                      </HStack>
                      <HStack space="xs" alignItems="center">
                        <ClockIcon size={14} className="text-typography-500" />
                        <Text size="xs" className="text-typography-400 font-medium">
                          {t.valid_until ? new Date(t.valid_until).toLocaleDateString() : 'Never expires'}
                        </Text>
                      </HStack>
                      <HStack space="xs" alignItems="center">
                        <CalendarIcon size={14} className="text-typography-500" />
                        <Text size="xs" className="text-typography-400 font-medium">
                          {new Date(t.created_at).toLocaleDateString()}
                        </Text>
                      </HStack>
                    </HStack>
                  </VStack>
                  
                  <HStack space="sm" className="w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border-800 pt-4 sm:pt-0 sm:pl-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      action={t.is_active ? 'secondary' : 'primary'}
                      onPress={() => toggleActive(t)}
                      className="flex-1 sm:flex-none"
                    >
                      <ButtonText>{t.is_active ? 'Revoke' : 'Reactivate'}</ButtonText>
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      action="negative"
                      onPress={() => remove(t)}
                      className="flex-1 sm:flex-none"
                    >
                      <ButtonIcon as={TrashIcon} mr="$2" />
                      <ButtonText>Delete</ButtonText>
                    </Button>
                  </HStack>
                </Card>
              )
            })
          )}
        </VStack>
      </Box>
    </Box>
  )
}
