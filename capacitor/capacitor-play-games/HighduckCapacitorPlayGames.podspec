
  Pod::Spec.new do |s|
    s.name = 'HighduckCapacitorPlayGames'
    s.version = '0.0.1'
    s.summary = 'Capacitor plugin for Google Play Game Services and Apple GameCenter'
    s.license = 'MIT'
    s.homepage = 'https://github.com/highduck/ilj'
    s.author = 'eliasku'
    s.source = { :git => 'https://github.com/highduck/ilj', :tag => s.version.to_s }
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
    s.ios.deployment_target  = '11.0'
    s.dependency 'Capacitor'
  end