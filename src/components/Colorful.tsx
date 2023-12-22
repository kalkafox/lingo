import { localSettingsAtom } from '@/util/atoms'
import { Colorful } from '@uiw/react-color'
import { useAtom } from 'jotai'

function ColorPicker() {
  const [localSettings, setLocalSettings] = useAtom(localSettingsAtom)

  return (
    <>
      <Colorful
        color={localSettings.background}
        disableAlpha={true}
        onChange={(color) => {
          setLocalSettings({
            background: color.hex,
          })
          window.localStorage.setItem('background', color.hex)
        }}
      />
    </>
  )
}

export default ColorPicker
