const fs = require('fs')
const path = require('path')

const ROUTES_DIR = path.join(__dirname, '../routes')
const OUTPUT = path.join(__dirname, '../../postman/Talki.postman_collection.json')

const MODULE_PREFIXES = {
  admin: {
    base: '/api/admin',
    parentAuth: {
      talkTopic: 'admin',
      faq: 'admin',
      identityproof: 'admin',
      listener: 'admin',
      coinplan: 'admin',
      paymentOption: 'admin',
      dashboard: 'admin',
      user: 'admin',
      withdrawalRecord: 'admin',
      history: 'admin',
      currency: 'admin',
      setting: 'admin',
      notification: 'admin',
      block: 'admin',
      report: 'admin',
      reportReason: 'admin',
      language: 'admin',
      translation: 'admin',
      login: 'none'
    }
  },
  user: { base: '/api/user', parentAuth: {} },
  listener: { base: '/api/listener', parentAuth: {} }
}

const ROUTE_BODY_OVERRIDES = {
  'POST /api/user/authenticateOrRegisterUser': {
    loginType: 4,
    email: 'user@test.com',
    password: 'password123',
    fcmToken: 'test-fcm-token',
    nickName: 'Test User',
    fullName: 'Test User'
  },
  'POST /api/user/verifyUserExistence': {
    identity: '',
    email: 'user@test.com',
    password: 'password123',
    loginType: 4
  }
}

const MANUAL_ADMIN_ROOT_ROUTES = [
  { method: 'POST', path: '/initiateAdminRegistration', auth: 'key', body: { email: '', password: '', uid: '', code: '', privateKey: {} } },
  { method: 'POST', path: '/authenticateAdmin', auth: 'admin', body: { email: '', password: '' } },
  { method: 'PATCH', path: '/updateProfileDetails', auth: 'admin', formdata: true },
  { method: 'PATCH', path: '/updatePassword', auth: 'admin', body: { oldPass: '', newPass: '', confirmPass: '' } },
  { method: 'GET', path: '/initiatePasswordReset', auth: 'key', query: { email: '' } },
  { method: 'GET', path: '/fetchAdminProfile', auth: 'admin' },
  { method: 'GET', path: '/confirmPasswordReset', auth: 'key' },
  { method: 'PATCH', path: '/verifyAdminEmail', auth: 'key', query: { email: '' } }
]

const MANUAL_SETTING_ROUTES = [
  { method: 'GET', path: '/verifyPurchaseCode', auth: 'admin' },
  { method: 'PATCH', path: '/modifySetting', auth: 'admin', body: { settingId: '' } },
  { method: 'PATCH', path: '/toggleAppSetting', auth: 'admin', query: { settingId: '', type: '' } },
  { method: 'GET', path: '/getSettingsData', auth: 'admin' }
]

function readRouteFiles(moduleName) {
  const moduleDir = path.join(ROUTES_DIR, moduleName)
  const files = fs.readdirSync(moduleDir).filter(file => file.endsWith('.route.js') && file !== 'route.js')
  return files.map(file => ({
    file,
    subPath: file.replace('.route.js', ''),
    content: fs.readFileSync(path.join(moduleDir, file), 'utf8')
  }))
}

function parseRoutesFromContent(content) {
  const routes = []
  const regex = /route\.(get|post|patch|put|delete)\(\s*["'`]([^"'`]+)["'`]/gi
  let match

  while ((match = regex.exec(content)) !== null) {
    routes.push({ method: match[1].toUpperCase(), path: match[2] })
  }

  return routes
}

function getRouteLine(content, routePath) {
  return content.split('\n').find(row => row.includes(`"${routePath}"`) || row.includes(`'${routePath}'`)) || ''
}

function detectAuth(content, moduleName, subPath, routePath) {
  const line = getRouteLine(content, routePath)

  if (moduleName === 'admin') {
    if (subPath === 'login') return 'none'
    if (subPath === 'admin') return detectAuthFromLine(content, routePath)
    return 'admin'
  }

  const hasUserAuth = /validateUserAuthToken/.test(line)
  const hasVerifyAuth = /verifyAuthToken/.test(line)
  const hasKey = /checkAccessWithSecretKey/.test(line)

  if (hasUserAuth && hasKey) return 'user'
  if (hasVerifyAuth && hasKey) return 'user-token'
  if (hasUserAuth) return 'user-no-key'
  if (hasKey) return 'key'
  return 'none'
}

function getMountPath(moduleName, subPath) {
  if (subPath === moduleName || subPath === 'admin') return ''
  return `/${subPath}`
}

function getFolderName(moduleName, subPath) {
  if (subPath === moduleName || subPath === 'admin') return 'Root'
  return subPath
}

function detectAuthFromLine(content, routePath) {
  const line = content.split('\n').find(row => row.includes(`"${routePath}"`) || row.includes(`'${routePath}'`))
  if (!line) return 'admin'

  if (/initiateAdminRegistration|initiatePasswordReset|confirmPasswordReset|verifyAdminEmail/.test(line)) {
    return /validateAdminAuth/.test(line) ? 'admin' : 'key'
  }

  if (/authenticateAdmin|updateProfileDetails|updatePassword|fetchAdminProfile/.test(routePath)) {
    return 'admin'
  }

  return /validateAdminAuth/.test(line) ? 'admin' : 'key'
}

function buildHeaders(authType) {
  const headers = []

  if (authType === 'key' || authType === 'admin' || authType === 'user' || authType === 'user-token' || authType === 'user-no-key') {
    if (authType !== 'user-no-key') {
      headers.push({ key: 'key', value: '{{secretKey}}', type: 'text' })
    }
  }

  if (authType === 'admin') {
    headers.push({ key: 'Authorization', value: 'Bearer {{adminToken}}', type: 'text' })
    headers.push({ key: 'x-admin-uid', value: '{{adminUid}}', type: 'text' })
  }

  if (authType === 'user' || authType === 'user-token' || authType === 'user-no-key') {
    headers.push({ key: 'x-auth-token', value: 'Bearer {{userToken}}', type: 'text' })
  }

  if (authType === 'user' || authType === 'user-no-key') {
    headers.push({ key: 'x-auth-uid', value: '{{userUid}}', type: 'text' })
  }

  return headers
}

function createRequest({ name, method, urlPath, authType, body, query, formdata }) {
  const request = {
    name,
    request: {
      method,
      header: buildHeaders(authType),
      url: {
        raw: `{{baseUrl}}${urlPath}`,
        host: ['{{baseUrl}}'],
        path: urlPath.replace(/^\//, '').split('/')
      }
    },
    response: []
  }

  if (query && Object.keys(query).length) {
    request.request.url.query = Object.entries(query).map(([key, value]) => ({ key, value: String(value) }))
    const queryString = request.request.url.query.map(item => `${item.key}=${item.value}`).join('&')
    request.request.url.raw = `{{baseUrl}}${urlPath}?${queryString}`
  }

  if (formdata) {
    request.request.body = {
      mode: 'formdata',
      formdata: [{ key: 'image', type: 'file', src: [] }]
    }
  } else if (body !== undefined) {
    request.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' })
    request.request.body = {
      mode: 'raw',
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: 'json' } }
    }
  } else if (['POST', 'PATCH', 'PUT'].includes(method)) {
    request.request.header.push({ key: 'Content-Type', value: 'application/json', type: 'text' })
    request.request.body = {
      mode: 'raw',
      raw: '{}',
      options: { raw: { language: 'json' } }
    }
  }

  return request
}

function addRoutesToFolder(folderMap, folderName, routes, basePath, authTypeResolver) {
  if (!folderMap.has(folderName)) {
    folderMap.set(folderName, [])
  }

  for (const route of routes) {
    const authType = typeof authTypeResolver === 'function' ? authTypeResolver(route) : authTypeResolver
    const fullPath = `${basePath}${route.path}`
    const itemName = `${route.method} ${route.path}`

    folderMap.get(folderName).push(
      createRequest({
        name: itemName,
        method: route.method,
        urlPath: fullPath,
        authType,
        body: ROUTE_BODY_OVERRIDES[`${route.method} ${fullPath}`] ?? route.body,
        query: route.query,
        formdata: route.formdata
      })
    )
  }
}

function buildCollection() {
  const topFolders = new Map()

  for (const moduleName of ['admin', 'user', 'listener']) {
    const moduleConfig = MODULE_PREFIXES[moduleName]
    const routeFiles = readRouteFiles(moduleName)
    const moduleFolder = new Map()

    for (const routeFile of routeFiles) {
      if (moduleName === 'admin' && routeFile.subPath === 'admin') continue
      if (moduleName === 'admin' && routeFile.subPath === 'setting') continue

      const mountPath = getMountPath(moduleName, routeFile.subPath)
      const parsedRoutes = parseRoutesFromContent(routeFile.content).map(route => ({
        ...route,
        authType: detectAuth(routeFile.content, moduleName, routeFile.subPath, route.path)
      }))

      const folderName = getFolderName(moduleName, routeFile.subPath)
      addRoutesToFolder(moduleFolder, folderName, parsedRoutes, `${moduleConfig.base}${mountPath}`, route => route.authType)
    }

    if (moduleName === 'admin') {
      addRoutesToFolder(moduleFolder, 'Root', MANUAL_ADMIN_ROOT_ROUTES, moduleConfig.base, route => route.auth)
      addRoutesToFolder(moduleFolder, 'setting', MANUAL_SETTING_ROUTES, `${moduleConfig.base}/setting`, route => route.auth)
    }

    const moduleItems = [...moduleFolder.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([folderName, items]) => ({
        name: folderName,
        item: items.sort((a, b) => a.name.localeCompare(b.name))
      }))

    topFolders.set(moduleName.charAt(0).toUpperCase() + moduleName.slice(1), moduleItems)
  }

  return {
    info: {
      _postman_id: 'talki-api-collection',
      name: 'Talki API',
      description: 'Talki / Talkin backend API collection.\n\nVariables:\n- baseUrl: http://localhost:5000\n- secretKey: backend .env secretKey\n- adminToken/adminUid: Firebase admin auth\n- userToken/userUid: Firebase user auth',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [...topFolders.entries()].map(([name, item]) => ({ name, item })),
    variable: [
      { key: 'baseUrl', value: 'http://localhost:5000' },
      { key: 'secretKey', value: '5TIvw5cpc0' },
      { key: 'adminToken', value: '' },
      { key: 'adminUid', value: '' },
      { key: 'userToken', value: '' },
      { key: 'userUid', value: '' },
      { key: 'listenerId', value: '' },
      { key: 'userId', value: '' }
    ]
  }
}

const collection = buildCollection()
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
fs.writeFileSync(OUTPUT, JSON.stringify(collection, null, 2))

const count = collection.item.reduce((sum, folder) => {
  return sum + folder.item.reduce((inner, sub) => inner + sub.item.length, 0)
}, 0)

console.log(`Generated ${count} requests -> ${OUTPUT}`)
