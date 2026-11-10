
## 5. `client/src/App.tsx`

Níže je kompletní soubor. Zachovává původní herní logiku, ukládání, správu provincií, armád, války, diplomacii i hospodářství. Změněna je navigace a rozložení mapové obrazovky.

## 6. Kompletní zdrojové soubory

Všechny soubory jsou připravené samostatně, bez ZIP archivu.

<box border radius="lg" gap={0}>
  <row align=center padding={3}>
    <icon name="file-code" size="xl"/>
    <box flex="1" gap={0}>
      **App.tsx**
      <text color="secondary" size="xs">Celý herní systém – 71,9 KB</text>
    </box>
    <badge color="success">Opraveno</badge>
  </row>
  <divider color="subtle"/>
  <box padding={3}>
    [Otevřít kompletní App.tsx](sandbox:/mnt/data/koruny-evropy-v0.10.0-kod/client/src/App.tsx)
  </box>
  <divider color="subtle"/>
  <row align=center padding={3}>
    <icon name="file-code" size="xl"/>
    <box flex="1" gap={0}>
      **styles.css**
      <text color="secondary" size="xs">Kompletní vzhled hry – 23,6 KB</text>
    </box>
  </row>
  <box padding={3}>
    [Otevřít kompletní styles.css](sandbox:/mnt/data/koruny-evropy-v0.10.0-kod/client/src/styles.css)
  </box>
  <divider color="subtle"/>
  <row align=center padding={3}>
    <icon name="file-code" size="xl"/>
    <box flex="1" gap={0}>
      **BottomNavigation.tsx**
      <text color="secondary" size="xs">Kompletní navigace</text>
    </box>
  </row>
  <box padding={3}>
    [Otevřít BottomNavigation.tsx](sandbox:/mnt/data/koruny-evropy-v0.10.0-kod/client/src/components/BottomNavigation.tsx)
  </box>
  <divider color="subtle"/>
  <row align=center padding={3}>
    <icon name="file-code" size="xl"/>
    <box flex="1" gap={0}>
      **index.html**
      <text color="secondary" size="xs">HTML vstupní soubor</text>
    </box>
  </row>
  <box padding={3}>
    [Otevřít index.html](sandbox:/mnt/data/koruny-evropy-v0.10.0-kod/client/index.html)
  </box>
  <divider color="subtle"/>
  <row align=center padding={3}>
    <icon name="file-code" size="xl"/>
    <box flex="1" gap={0}>
      **package.json**
      <text color="secondary" size="xs">Závislosti a verze</text>
    </box>
  </row>
  <box padding={3}>
    [Otevřít package.json](sandbox:/mnt/data/koruny-evropy-v0.10.0-kod/client/package.json)
  </box>
  <divider color="subtle"/>
  <row align=center padding={3}>
    <icon name="file-text" size="xl"/>
    <box flex="1" gap={0}>
      **README.md**
      <text color="secondary" size="xs">Dokumentace verze 0.10.0</text>
    </box>
  </row>
  <box padding={3}>
    [Otevřít README.md](sandbox:/mnt/data/koruny-evropy-v0.10.0-kod/README.md)
  </box>
</box>

**Instalace a spuštění:**

```bash
cd client
npm install
npm run dev