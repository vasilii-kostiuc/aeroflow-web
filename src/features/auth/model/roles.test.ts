import { describe, expect, it } from 'vitest'

import { claimsFor, hasRole, userRole } from './roles'

describe('roles', () => {
  it('reads the strongest role from the claims', () => {
    expect(userRole({ roles: ['ROLE_USER'] })).toBeNull()
    expect(userRole({ roles: ['ROLE_DISPATCHER', 'ROLE_USER'] })).toBe('dispatcher')
    expect(userRole({ roles: ['ROLE_DISPATCHER', 'ROLE_ADMIN'] })).toBe('admin')
    expect(userRole(null)).toBeNull()
  })

  it('lets an administrator do what a dispatcher does, not the other way round', () => {
    expect(hasRole('admin', 'dispatcher')).toBe(true)
    expect(hasRole('dispatcher', 'dispatcher')).toBe(true)
    expect(hasRole('dispatcher', 'admin')).toBe(false)
    expect(hasRole(null, 'dispatcher')).toBe(false)
  })

  it('turns a /me role back into claims', () => {
    expect(claimsFor('admin')).toEqual(['ROLE_ADMIN', 'ROLE_USER'])
    expect(claimsFor(null)).toEqual(['ROLE_USER'])
    expect(userRole({ roles: claimsFor('dispatcher') })).toBe('dispatcher')
  })
})
